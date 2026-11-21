import bcrypt from "bcryptjs";
import crypto from "node:crypto";

/* === Configuração === */
const dbUrl = (process.env.TURSO_DATABASE_URL || "").replace(/^libsql:\/\//, "https://");
const dbToken = process.env.TURSO_AUTH_TOKEN;
const secret = process.env.ADMIN_SECRET;

/* Site e API ficam no mesmo domínio: não há necessidade de liberar CORS. */
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const resp = (status, body) => ({ statusCode: status, headers, body: JSON.stringify(body) });
const ok = (data) => resp(200, data);
const erro = (msg, status = 400) => resp(status, { error: msg });

/* === Cliente HTTP do Turso (sem binários nativos) === */
async function sql(query, args = []) {
  const r = await fetch(dbUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${dbToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ statements: [{ q: query, params: args }] }),
  });
  const texto = await r.text();
  let j;
  try { j = JSON.parse(texto); } catch { throw new Error(`Turso HTTP ${r.status}: ${texto.slice(0, 200)}`); }
  const item = Array.isArray(j) ? j[0] : j;
  /* O erro pode vir no topo (falha de autenticação) ou dentro do item (falha de SQL) */
  const falha = j?.error ?? item?.error;
  if (!r.ok || falha) {
    throw new Error(typeof falha === "string" ? falha : falha?.message || `Turso HTTP ${r.status}`);
  }
  const result = item?.results;
  if (!result) return [];
  const cols = result.columns || [];
  const rows = result.rows || [];
  if (!cols.length) return [];
  return rows.map((arr) => {
    const o = {};
    cols.forEach((c, i) => { o[c] = arr[i]; });
    return o;
  });
}
const exec = sql;
const str = (v, max = 500) => String(v ?? "").slice(0, max);

/* === Normalização de entradas (aceita formatos variados, grava num formato único) === */
class EntradaInvalida extends Error {}

/* Preço: aceita "18", "18,5", "18.50", "R$ 18,00", "1.234,56" -> grava "18,00". Vazio = sem preço. */
export function normalizarPreco(v) {
  let t = String(v ?? "").replace(/R\$|\s/gi, "");
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(,\d{1,2})?$/.test(t)) t = t.replace(",", ".");
  else if (!/^\d+(\.\d{1,2})?$/.test(t)) throw new EntradaInvalida("Preço inválido. Use só números, por exemplo 18,00.");
  const n = Number(t);
  if (!(n > 0 && n < 100000)) throw new EntradaInvalida("Preço inválido. Informe um valor entre 0,01 e 99.999,99.");
  return n.toFixed(2).replace(".", ",");
}

/* Imagem: só arquivos da pasta img/ do site ou endereços https */
export function validarImagem(v, padrao) {
  const t = str(v, 300).trim();
  if (!t) return padrao;
  if (/^img\/[\w.-]+\.(jpe?g|png|webp|gif|svg)$/i.test(t) || /^https:\/\/[^\s"'<>]+$/i.test(t)) return t;
  throw new EntradaInvalida("Imagem inválida. Escolha um arquivo da lista ou use um endereço https://.");
}

/* WhatsApp: guarda só dígitos, com DDI 55 */
export function normalizarWhatsapp(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12 || d.length > 13) throw new EntradaInvalida("WhatsApp inválido. Informe o número com DDD, por exemplo 33 98704-6287.");
  return d;
}

/* Instagram: aceita "@perfil", "perfil" ou o link -> grava o link completo */
export function normalizarInstagram(v) {
  const t = String(v ?? "").trim();
  if (!t) return "";
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i);
  if (!m) throw new EntradaInvalida("Instagram inválido. Use o perfil (@gelo.jamp) ou o link do perfil.");
  return `https://www.instagram.com/${m[1]}/`;
}

/* === Limite de tentativas (memória da instância) ===
   Funções serverless podem ter várias instâncias, então isto freia abusos
   simples mas não substitui um limite na borda. */
const contadores = new Map();
function excedeu(chave, max, janelaMs) {
  const agora = Date.now();
  if (contadores.size > 5000) for (const [k, v] of contadores) if (v.ate < agora) contadores.delete(k);
  let c = contadores.get(chave);
  if (!c || c.ate < agora) { c = { n: 0, ate: agora + janelaMs }; contadores.set(chave, c); }
  c.n++;
  return c.n > max;
}
function ipDe(event) {
  const h = event.headers || {};
  return h["x-nf-client-connection-ip"] || h["client-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "desconhecido";
}

/* === Autenticação JWT === */
const b64 = (s) => Buffer.from(s).toString("base64url");
function assinar(payload) {
  const h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const b = b64(JSON.stringify(payload));
  const s = crypto.createHmac("sha256", secret).update(`${h}.${b}`).digest("base64url");
  return `${h}.${b}.${s}`;
}
function verificar(auth) {
  if (!auth?.startsWith("Bearer ")) return null;
  const [h, b, s] = auth.slice(7).split(".");
  if (!h || !b || !s) return null;
  const esperado = crypto.createHmac("sha256", secret).update(`${h}.${b}`).digest("base64url");
  try {
    if (s.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(esperado))) return null;
    const p = JSON.parse(Buffer.from(b, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

/* === Leituras === */
async function listarProdutos(soAtivos) {
  const rows = await sql(`SELECT id, name, description, weight, price, image, active, featured FROM "Product"${soAtivos ? " WHERE active = 1" : ""} ORDER BY "createdAt" DESC`);
  return rows.map((p) => ({ id: p.id, nome: p.name, descricao: p.description ?? "", peso: p.weight ?? "", preco: p.price ?? null, imagem: p.image ?? "", ativo: !!Number(p.active), destaque: !!Number(p.featured) }));
}
async function listarGaleria(soAtivas) {
  const rows = await sql(`SELECT id, title, category, image, active FROM "GalleryImage"${soAtivas ? " WHERE active = 1" : ""} ORDER BY id`);
  return rows.map((g) => ({ id: g.id, titulo: g.title, categoria: g.category ?? "Geral", imagem: g.image, ativa: !!Number(g.active) }));
}
async function listarConfig() {
  const rows = await sql('SELECT key, value FROM "Setting"');
  const cfg = {}; rows.forEach((r) => { cfg[r.key] = r.value; }); return cfg;
}
async function listarPedidos() {
  const rows = await sql('SELECT id, "customerName", "customerPhone", "productName", message, status, "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 200');
  return rows.map((o) => ({ id: o.id, cliente: o.customerName ?? "", telefone: o.customerPhone ?? "", produto: o.productName ?? "", mensagem: o.message ?? "", status: o.status ?? "NOVO", data: o.createdAt }));
}

/* === Configurações (somente chaves conhecidas; cria a chave se não existir) === */
const CHAVES_CONFIG = ["company_name", "endereco", "company_city", "regiao_entrega", "company_whatsapp", "instagram_url", "slogan", "descricao"];
let colunasSetting = null;
async function salvarConfig(chave, valor, now) {
  const existe = await sql('SELECT key FROM "Setting" WHERE key = ?', [chave]);
  if (existe.length) {
    await exec('UPDATE "Setting" SET value=?,"updatedAt"=? WHERE key=?', [valor, now, chave]);
    return;
  }
  if (!colunasSetting) colunasSetting = (await sql("SELECT name FROM pragma_table_info('Setting')")).map((c) => c.name);
  const possiveis = { id: crypto.randomUUID(), key: chave, value: valor, createdAt: now, updatedAt: now };
  const cols = Object.keys(possiveis).filter((c) => colunasSetting.includes(c));
  await exec(`INSERT INTO "Setting" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols.map(() => "?").join(",")})`, cols.map((c) => possiveis[c]));
}

/* === Handler === */
export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return resp(204, "");
  if (!dbUrl || !dbToken) return erro("Banco não configurado", 500);
  if (!secret) return erro("Segredo não configurado", 500);

  const params = event.queryStringParameters || {};
  const resource = params.resource || "";
  const method = event.httpMethod;
  const auth = (event.headers || {}).authorization;
  const ip = ipDe(event);
  let body = {};
  if (["POST", "PUT"].includes(method)) {
    try { body = JSON.parse(event.body || "{}") || {}; } catch { return erro("JSON inválido"); }
  }

  try {
    /* Login público, com limite de tentativas por IP */
    if (resource === "login" && method === "POST") {
      if (excedeu(`login:${ip}`, 8, 15 * 60 * 1000)) return erro("Muitas tentativas. Aguarde alguns minutos.", 429);
      const email = str(body.email, 200).trim().toLowerCase();
      const senha = str(body.senha, 200);
      if (!email || !senha) return erro("Informe e-mail e senha");
      const users = await sql('SELECT id, email, password FROM "User" WHERE email = ?', [email]);
      if (!users.length || !(await bcrypt.compare(senha, users[0].password))) return erro("Credenciais inválidas", 401);
      contadores.delete(`login:${ip}`);
      const token = assinar({ sub: users[0].id, email: users[0].email, role: "ADMIN", exp: Date.now() + 8 * 60 * 60 * 1000 });
      return ok({ token, nome: "Administrador", email: users[0].email });
    }

    const admin = verificar(auth);

    /* Leitura pública (itens ocultos só aparecem para o administrador) */
    if (method === "GET" && resource === "produtos") return ok({ produtos: await listarProdutos(!admin) });
    if (method === "GET" && resource === "galeria") return ok({ fotos: await listarGaleria(!admin) });
    if (method === "GET" && resource === "config") return ok({ config: await listarConfig() });

    /* Registro de pedido pelo site: só para produtos existentes e ativos */
    if (resource === "pedidos" && method === "POST") {
      if (excedeu(`pedido:${ip}`, 10, 10 * 60 * 1000)) return erro("Muitos pedidos em sequência. Aguarde alguns minutos.", 429);
      const produtoId = str(body.produtoId, 100).trim();
      if (!produtoId) return erro("Informe o produto");
      const prod = await sql('SELECT name, weight FROM "Product" WHERE id = ? AND active = 1', [produtoId]);
      if (!prod.length) return erro("Produto não encontrado", 404);
      /* Mesmo formato da mensagem do WhatsApp: "Gelo em Cubos (5 kg)" */
      const produto = prod[0].weight ? `${prod[0].name} (${prod[0].weight})` : prod[0].name;
      const nome = str(body.cliente, 80).trim() || "Visitante do site";
      const id = crypto.randomUUID(), now = new Date().toISOString();
      await exec('INSERT INTO "Order" (id, "customerName", "customerPhone", "productName", message, status, "whatsappSent", "createdAt", "updatedAt") VALUES (?,?,?,?,?,?,?,?,?)',
        [id, nome, str(body.telefone, 30), produto, str(body.mensagem, 500), "NOVO", 1, now, now]);
      return ok({ id });
    }

    /* Daqui em diante, tudo exige login */
    if (!admin) return erro("Não autorizado", 401);
    const now = new Date().toISOString();

    if (resource === "pedidos" && method === "GET") return ok({ pedidos: await listarPedidos() });

    if (resource === "produtos") {
      if (method === "POST") {
        const nome = str(body.nome, 120).trim();
        if (!nome) return erro("Informe o nome");
        const id = crypto.randomUUID();
        await exec('INSERT INTO "Product" (id,name,description,weight,price,image,active,featured,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?)',
          [id, nome, str(body.descricao, 1000), str(body.peso, 80), normalizarPreco(body.preco), validarImagem(body.imagem, "img/gelo-5kg.jpeg"), body.ativo !== false ? 1 : 0, body.destaque ? 1 : 0, now, now]);
        return ok({ id });
      }
      if (method === "PUT") {
        const id = str(params.id || body.id); if (!id) return erro("Informe o id");
        const nome = str(body.nome, 120).trim(); if (!nome) return erro("Informe o nome");
        await exec('UPDATE "Product" SET name=?,description=?,weight=?,price=?,image=?,active=?,featured=?,"updatedAt"=? WHERE id=?',
          [nome, str(body.descricao, 1000), str(body.peso, 80), normalizarPreco(body.preco), validarImagem(body.imagem, "img/gelo-5kg.jpeg"), body.ativo ? 1 : 0, body.destaque ? 1 : 0, now, id]);
        return ok({ ok: true });
      }
      if (method === "DELETE") {
        const id = str(params.id || body.id); if (!id) return erro("Informe o id");
        await exec('DELETE FROM "Product" WHERE id=?', [id]); return ok({ ok: true });
      }
    }

    if (resource === "galeria") {
      if (method === "POST") {
        const titulo = str(body.titulo, 120).trim(); if (!titulo) return erro("Informe o título");
        const id = crypto.randomUUID();
        await exec('INSERT INTO "GalleryImage" (id,title,image,category,active,"createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)',
          [id, titulo, validarImagem(body.imagem, "img/logo-gelo-jamp.jpeg"), str(body.categoria, 60).trim() || "Geral", body.ativa !== false ? 1 : 0, now, now]);
        return ok({ id });
      }
      if (method === "PUT") {
        const id = str(params.id || body.id); if (!id) return erro("Informe o id");
        const titulo = str(body.titulo, 120).trim(); if (!titulo) return erro("Informe o título");
        await exec('UPDATE "GalleryImage" SET title=?,image=?,category=?,active=?,"updatedAt"=? WHERE id=?',
          [titulo, validarImagem(body.imagem, "img/logo-gelo-jamp.jpeg"), str(body.categoria, 60).trim() || "Geral", body.ativa ? 1 : 0, now, id]);
        return ok({ ok: true });
      }
      if (method === "DELETE") {
        const id = str(params.id || body.id); if (!id) return erro("Informe o id");
        await exec('DELETE FROM "GalleryImage" WHERE id=?', [id]); return ok({ ok: true });
      }
    }

    if (resource === "config" && method === "PUT") {
      /* Valida tudo antes de gravar qualquer coisa: ou salva o formulário inteiro, ou nada */
      const valores = {};
      for (const chave of CHAVES_CONFIG) {
        if (!(chave in body)) continue;
        let v = str(body[chave], 300).trim();
        if (chave === "company_whatsapp") v = normalizarWhatsapp(v);
        if (chave === "instagram_url") v = normalizarInstagram(v);
        valores[chave] = v;
      }
      for (const [chave, v] of Object.entries(valores)) await salvarConfig(chave, v, now);
      return ok({ ok: true });
    }
    if (resource === "pedido-status" && method === "PUT") {
      const id = str(params.id || body.id), status = str(body.status);
      if (!id || !["NOVO", "CONFIRMADO", "ENTREGUE", "CANCELADO"].includes(status)) return erro("Dados inválidos");
      await exec('UPDATE "Order" SET status=?,"updatedAt"=? WHERE id=?', [status, now, id]); return ok({ ok: true });
    }
    if (resource === "pedidos" && method === "DELETE") {
      const id = str(params.id || body.id); if (!id) return erro("Informe o id");
      await exec('DELETE FROM "Order" WHERE id=?', [id]); return ok({ ok: true });
    }
    return erro("Recurso não encontrado", 404);
  } catch (e) {
    /* Entrada inválida: a mensagem explica como corrigir */
    if (e instanceof EntradaInvalida) return erro(e.message, 400);
    /* Detalhes ficam só no log da Netlify; o visitante recebe uma mensagem genérica */
    console.error("ERRO:", e);
    return erro("Erro interno. Tente novamente.", 500);
  }
}
