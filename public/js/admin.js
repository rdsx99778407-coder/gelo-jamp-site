/* ============================================================
   GELO JAMP — Painel administrativo (API + autenticação)
   ============================================================ */
const API = "/.netlify/functions/api";
const TOKEN_KEY = "gj_admin_token";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));


/* Ícones de traço para as ações (no lugar de emojis, que mudam de aparência em cada sistema) */
const ICONE_EDITAR = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICONE_EXCLUIR = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

let token = localStorage.getItem(TOKEN_KEY) || "";
let produtos = [], fotos = [], pedidos = [], config = {};

let toastTimer;
function toast(msg) {
  const t = $("toast"); if (!t) return;
  t.textContent = msg; t.classList.add("mostrar");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("mostrar"), 3200);
}

async function api(resource, method = "GET", body = null, id = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API}?resource=${resource}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  /* No login, 401 significa senha errada — não sessão expirada */
  if (r.status === 401 && resource !== "login") { logout(); throw new Error("Sessão expirada. Entre novamente."); }
  if (!r.ok) throw new Error(data.error || "Erro na operação");
  return data;
}

/* Executa uma ação do painel mostrando o erro em vez de falhar em silêncio */
async function acao(fn) {
  try { await fn(); } catch (err) { toast(err.message || "Erro na operação"); }
}

/* ---------- Entradas flexíveis, gravadas num formato único (a API valida de novo) ---------- */
function normalizarPreco(v) {
  let t = String(v ?? "").replace(/R\$|\s/gi, "");
  if (!t) return { ok: true, valor: null };
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(,\d{1,2})?$/.test(t)) t = t.replace(",", ".");
  else if (!/^\d+(\.\d{1,2})?$/.test(t)) return { ok: false, msg: "Use só números, por exemplo 18,00." };
  const n = Number(t);
  if (!(n > 0 && n < 100000)) return { ok: false, msg: "Informe um valor entre 0,01 e 99.999,99." };
  return { ok: true, valor: n.toFixed(2).replace(".", ",") };
}
function normalizarWhatsapp(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (!d) return { ok: true, valor: "" };
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12 || d.length > 13) return { ok: false, msg: "Informe o número com DDD, por exemplo 33 98704-6287." };
  return { ok: true, valor: d };
}
function normalizarInstagram(v) {
  const t = String(v ?? "").trim();
  if (!t) return { ok: true, valor: "" };
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i);
  return m ? { ok: true, valor: `https://www.instagram.com/${m[1]}/` } : { ok: false, msg: "Use o perfil (@gelo.jamp) ou o link do perfil." };
}
const imagemValida = (v) => !v || /^img\/[\w.-]+\.(jpe?g|png|webp|gif|svg)$/i.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v);
/* Mostra preços antigos gravados como "18" ou "R$ 18" no formato "R$ 18,00" */
function formatarPreco(p) {
  const r = normalizarPreco(p);
  return r.ok && r.valor ? `R$ ${r.valor}` : `R$ ${String(p).replace(/^R\$\s*/i, "")}`;
}

/* ---------- Erros em linha, junto ao campo ---------- */
function mostrarErroCampo(id, msg) {
  const campo = $(id), slot = $(`${id}-erro`);
  campo.setAttribute("aria-invalid", "true");
  if (slot) { slot.textContent = msg; slot.hidden = false; }
}
function limparErros(form) {
  form.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
  form.querySelectorAll(".erro-campo").forEach((s) => { s.textContent = ""; s.hidden = true; });
}
/* Foca o primeiro campo com erro; devolve true se havia algum */
function focarPrimeiroErro(form) {
  const primeiro = form.querySelector('[aria-invalid="true"]');
  primeiro?.focus();
  return !!primeiro;
}

/* Prévia da imagem escolhida, para reconhecer em vez de lembrar caminhos de arquivo */
function atualizarPrevia(id) {
  const v = $(id).value.trim(), previa = $(`${id}-previa`);
  if (imagemValida(v) && v) previa.src = v; else previa.removeAttribute("src");
}
["mp-imagem", "mg-imagem"].forEach((id) => $(id).addEventListener("input", () => atualizarPrevia(id)));

/* Botão de envio fica desabilitado e com "…" enquanto a requisição acontece */
async function ocupado(form, texto, fn) {
  const btn = form.querySelector('[type="submit"]');
  const original = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = texto; }
  try { return await fn(); } finally { if (btn) { btn.disabled = false; btn.textContent = original; } }
}

/* ---------- Modais acessíveis: foco entra no primeiro campo, Esc fecha, foco volta ao botão de origem ---------- */
let origemModal = null;
function abrirModal(id) {
  origemModal = document.activeElement;
  const m = $(id);
  m.classList.add("aberto");
  m.querySelector("input, textarea, select, button")?.focus();
}
function fecharModal(id) {
  $(id).classList.remove("aberto");
  if (origemModal && document.contains(origemModal)) origemModal.focus();
  origemModal = null;
}
document.addEventListener("keydown", (e) => {
  const aberto = document.querySelector(".modal.aberto");
  if (!aberto) return;
  if (e.key === "Escape") { fecharModal(aberto.id); return; }
  if (e.key === "Tab") {
    /* Mantém o Tab dentro do modal */
    const focaveis = [...aberto.querySelectorAll("input, textarea, select, button")].filter((el) => !el.disabled);
    const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
});

function logout() {
  token = ""; localStorage.removeItem(TOKEN_KEY);
  $("tela-painel").style.display = "none";
  $("tela-login").style.display = "grid";
}

/* ---------- Login ---------- */
$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erro = $("login-erro"); erro.classList.remove("mostrar");
  let data;
  try {
    data = await ocupado(e.target, "Entrando…", () => api("login", "POST", { email: $("login-email").value, senha: $("login-senha").value }));
  } catch (err) {
    erro.textContent = err.message || "Falha no login"; erro.classList.add("mostrar");
    return;
  }
  token = data.token; localStorage.setItem(TOKEN_KEY, token);
  $("login-senha").value = "";
  $("email-usuario").textContent = data.email;
  $("tela-login").style.display = "none";
  $("tela-painel").style.display = "flex";
  await carregarTudo();
  trocarSecao("dashboard");
});

$("btn-sair").addEventListener("click", logout);

/* ---------- Navegação ---------- */
function trocarSecao(nome) {
  document.querySelectorAll(".secao-admin").forEach((s) => s.classList.remove("ativa"));
  $(`secao-${nome}`)?.classList.add("ativa");
  document.querySelectorAll("[data-secao-btn]").forEach((b) => {
    const atual = b.dataset.secaoBtn === nome;
    b.classList.toggle("ativo", atual);
    if (atual) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  const titulos = {
    dashboard: ["Painel", "Visão geral da Gelo Jamp"],
    produtos: ["Produtos", "Cadastre e gerencie os produtos"],
    galeria: ["Galeria", "Gerencie as fotos do site"],
    pedidos: ["Pedidos", "Pedidos registrados pelo site"],
    configuracoes: ["Configurações", "Informações do site"],
  };
  const [t, d] = titulos[nome] || ["", ""];
  $("titulo-secao").textContent = t; $("subtitulo-secao").textContent = d;
  if (nome === "dashboard") renderPainel();
  if (nome === "produtos") renderProdutos();
  if (nome === "galeria") renderGaleria();
  if (nome === "pedidos") renderPedidos();
  if (nome === "configuracoes") renderConfig();
}
document.querySelectorAll("[data-secao-btn]").forEach((b) => b.addEventListener("click", () => trocarSecao(b.dataset.secaoBtn)));

/* ---------- Carregamento ---------- */
async function carregarTudo() {
  try {
    const [p, g, c, pe] = await Promise.all([
      api("produtos"), api("galeria"), api("config"), api("pedidos"),
    ]);
    produtos = p.produtos || []; fotos = g.fotos || []; config = c.config || {}; pedidos = pe.pedidos || [];
  } catch (err) { toast(err.message); }
}

/* ---------- Renderização ---------- */
function renderPainel() {
  $("stat-produtos").textContent = produtos.length;
  $("stat-destaques").textContent = produtos.filter((p) => p.destaque).length;
  $("stat-novos").textContent = pedidos.filter((p) => p.status === "NOVO").length;
  $("stat-fotos").textContent = fotos.length;
  $("tabela-ultimos").innerHTML = pedidos.slice(0, 6).length
    ? pedidos.slice(0, 6).map((p) => `<tr><td>${new Date(p.data).toLocaleDateString("pt-BR")}</td><td>${esc(p.cliente)}</td><td>${esc(p.produto)}</td><td><span class="badge azul">${esc(p.status)}</span></td></tr>`).join("")
    : `<tr><td colspan="4" style="color:var(--texto-suave);padding:18px;white-space:normal">Nenhum pedido ainda. Eles aparecem aqui quando um cliente toca em "Pedir pelo WhatsApp" no site.</td></tr>`;
}

function renderProdutos() {
  $("tabela-produtos").innerHTML = produtos.length
    ? produtos.map((p) => `<tr>
      <td><img class="ft-mini" src="${esc(p.imagem)}" alt=""></td>
      <td><strong>${esc(p.nome)}</strong><br><small style="color:#8aa0b5">${esc(p.peso)}</small></td>
      <td>${p.preco ? esc(formatarPreco(p.preco)) : "Consulte preço"}</td>
      <td>${p.destaque ? '<span class="badge azul">Destaque</span>' : ""}</td>
      <td><button type="button" class="alternar ${p.ativo ? "on" : ""}" data-toggle="${esc(p.id)}" aria-pressed="${p.ativo ? "true" : "false"}" aria-label="Mostrar ${esc(p.nome)} no site"></button></td>
      <td style="text-align:right;white-space:nowrap">
        <button type="button" class="acao-mini editar" data-editar="${esc(p.id)}" aria-label="Editar ${esc(p.nome)}">${ICONE_EDITAR}</button>
        <button type="button" class="acao-mini excluir" data-excluir="${esc(p.id)}" aria-label="Excluir ${esc(p.nome)}">${ICONE_EXCLUIR}</button>
      </td></tr>`).join("")
    : `<tr><td colspan="6" style="color:var(--texto-suave);padding:18px;white-space:normal">Nenhum produto cadastrado. Use "Novo produto" para adicionar o primeiro.</td></tr>`;

  document.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => acao(async () => {
    const p = produtos.find((x) => x.id === b.dataset.toggle);
    if (!p) return;
    await api("produtos", "PUT", { ...p, ativo: !p.ativo }, p.id);
    await carregarTudo(); renderProdutos(); toast("Produto atualizado");
  })));
  document.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => abrirProduto(b.dataset.editar)));
  document.querySelectorAll("[data-excluir]").forEach((b) => b.addEventListener("click", () => acao(async () => {
    if (!confirm("Excluir este produto?")) return;
    await api("produtos", "DELETE", null, b.dataset.excluir);
    await carregarTudo(); renderProdutos(); toast("Produto excluído");
  })));
}

function renderGaleria() {
  $("grade-galeria-admin").innerHTML = fotos.length
    ? fotos.map((g) => `<div class="item ${g.ativa ? "" : "inativa"}">
        <img src="${esc(g.imagem)}" alt="" width="400" height="340" loading="lazy">
        <div class="acoes"><button type="button" data-editar-foto="${esc(g.id)}" aria-label="Editar foto ${esc(g.titulo)}">${ICONE_EDITAR}</button><button type="button" data-excluir-foto="${esc(g.id)}" aria-label="Excluir foto ${esc(g.titulo)}">${ICONE_EXCLUIR}</button></div>
        <div class="info">${esc(g.titulo)}<small>${esc(g.categoria)}${g.ativa ? "" : " · oculta"}</small></div></div>`).join("")
    : `<p style="color:var(--texto-suave)">Nenhuma foto cadastrada. Use "Nova foto" para adicionar a primeira.</p>`;
  document.querySelectorAll("[data-editar-foto]").forEach((b) => b.addEventListener("click", () => abrirFoto(b.dataset.editarFoto)));
  document.querySelectorAll("[data-excluir-foto]").forEach((b) => b.addEventListener("click", () => acao(async () => {
    if (!confirm("Excluir esta foto?")) return;
    await api("galeria", "DELETE", null, b.dataset.excluirFoto);
    await carregarTudo(); renderGaleria(); toast("Foto excluída");
  })));
}

function renderPedidos() {
  $("tabela-pedidos").innerHTML = pedidos.length
    ? pedidos.map((p) => `<tr>
      <td><small>${new Date(p.data).toLocaleString("pt-BR")}</small></td>
      <td>${esc(p.cliente)}</td><td>${esc(p.produto)}</td>
      <td><select class="status-pedido status-${esc(p.status)}" data-status="${esc(p.id)}" aria-label="Status do pedido de ${esc(p.cliente)}">${["NOVO","CONFIRMADO","ENTREGUE","CANCELADO"].map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
      <td style="text-align:right"><button type="button" class="acao-mini excluir" data-excluir-pedido="${esc(p.id)}" aria-label="Excluir pedido de ${esc(p.cliente)}">${ICONE_EXCLUIR}</button></td></tr>`).join("")
    : `<tr><td colspan="5" style="color:var(--texto-suave);padding:18px;white-space:normal">Nenhum pedido ainda. Eles aparecem aqui quando um cliente toca em "Pedir pelo WhatsApp" no site.</td></tr>`;
  document.querySelectorAll("[data-status]").forEach((s) => s.addEventListener("change", () => acao(async () => {
    await api("pedido-status", "PUT", { status: s.value }, s.dataset.status);
    await carregarTudo(); renderPedidos(); toast("Status atualizado");
  })));
  document.querySelectorAll("[data-excluir-pedido]").forEach((b) => b.addEventListener("click", () => acao(async () => {
    if (!confirm("Excluir este pedido?")) return;
    await api("pedidos", "DELETE", null, b.dataset.excluirPedido);
    await carregarTudo(); renderPedidos(); toast("Pedido excluído");
  })));
}

function renderConfig() {
  $("cfg-nome").value = config.company_name || "";
  $("cfg-endereco").value = config.endereco || "";
  $("cfg-cidade").value = config.company_city || "";
  $("cfg-regiao").value = config.regiao_entrega || "";
  /* Mostra o número legível (+55 33 98704-6287), mesmo que esteja gravado só com dígitos */
  const fone = String(config.company_whatsapp || "").replace(/\D/g, "").match(/^(55)(\d{2})(\d{4,5})(\d{4})$/);
  $("cfg-whats-display").value = fone ? `+${fone[1]} ${fone[2]} ${fone[3]}-${fone[4]}` : config.company_whatsapp || "";
  $("cfg-insta").value = config.instagram_url || "";
  $("cfg-slogan").value = config.slogan || "";
}

/* ---------- Modais ---------- */
let editandoProduto = null, editandoFoto = null;
function abrirProduto(id) {
  editandoProduto = id; const p = produtos.find((x) => x.id === id);
  $("modal-produto-titulo").textContent = id ? "Editar produto" : "Novo produto";
  $("mp-nome").value = p?.nome || ""; $("mp-peso").value = p?.peso || "";
  $("mp-preco").value = p?.preco || ""; $("mp-descricao").value = p?.descricao || "";
  $("mp-imagem").value = p?.imagem || ""; $("mp-destaque").checked = !!p?.destaque; $("mp-ativo").checked = p ? !!p.ativo : true;
  limparErros($("form-produto")); atualizarPrevia("mp-imagem");
  abrirModal("modal-produto");
}
function abrirFoto(id) {
  editandoFoto = id; const g = fotos.find((x) => x.id === id);
  $("modal-foto-titulo").textContent = id ? "Editar foto" : "Nova foto";
  $("mg-titulo").value = g?.titulo || ""; $("mg-categoria").value = g?.categoria || "";
  $("mg-imagem").value = g?.imagem || ""; $("mg-ativa").checked = g ? !!g.ativa : true;
  /* Categorias já usadas viram sugestões: evita "Produto" e "Produtos" como filtros diferentes */
  $("lista-categorias").innerHTML = [...new Set(fotos.map((f) => f.categoria).filter(Boolean))].map((c) => `<option value="${esc(c)}"></option>`).join("");
  limparErros($("form-foto")); atualizarPrevia("mg-imagem");
  abrirModal("modal-foto");
}
document.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", () => fecharModal(b.dataset.fechar)));

$("btn-novo-produto").addEventListener("click", () => abrirProduto(null));
$("btn-nova-foto").addEventListener("click", () => abrirFoto(null));

$("form-produto").addEventListener("submit", (e) => {
  e.preventDefault();
  acao(async () => {
    const form = e.target;
    limparErros(form);
    const preco = normalizarPreco($("mp-preco").value);
    if (!preco.ok) mostrarErroCampo("mp-preco", preco.msg);
    const imagem = $("mp-imagem").value.trim();
    if (!imagemValida(imagem)) mostrarErroCampo("mp-imagem", "Escolha uma foto da lista ou use um endereço https://.");
    if (focarPrimeiroErro(form)) return;
    if (preco.valor) $("mp-preco").value = preco.valor; /* mostra o formato que será gravado */
    const dados = {
      nome: $("mp-nome").value.trim(), peso: $("mp-peso").value.trim(), preco: preco.valor,
      descricao: $("mp-descricao").value.trim(), imagem: imagem || "img/gelo-5kg.jpeg",
      destaque: $("mp-destaque").checked, ativo: $("mp-ativo").checked,
    };
    if (!dados.nome) return;
    await ocupado(e.target, "Salvando…", () => api("produtos", editandoProduto ? "PUT" : "POST", dados, editandoProduto));
    fecharModal("modal-produto");
    await carregarTudo(); renderProdutos(); toast("Produto salvo");
  });
});

$("form-foto").addEventListener("submit", (e) => {
  e.preventDefault();
  acao(async () => {
    const form = e.target;
    limparErros(form);
    const imagem = $("mg-imagem").value.trim();
    if (!imagemValida(imagem)) mostrarErroCampo("mg-imagem", "Escolha uma foto da lista ou use um endereço https://.");
    if (focarPrimeiroErro(form)) return;
    const dados = {
      titulo: $("mg-titulo").value.trim(), categoria: $("mg-categoria").value.trim() || "Geral",
      imagem: imagem || "img/logo-gelo-jamp.jpeg", ativa: $("mg-ativa").checked,
    };
    await ocupado(e.target, "Salvando…", () => api("galeria", editandoFoto ? "PUT" : "POST", dados, editandoFoto));
    fecharModal("modal-foto");
    await carregarTudo(); renderGaleria(); toast("Foto salva");
  });
});

$("form-config").addEventListener("submit", (e) => {
  e.preventDefault();
  acao(async () => {
    const form = e.target;
    limparErros(form);
    const whats = normalizarWhatsapp($("cfg-whats-display").value);
    if (!whats.ok) mostrarErroCampo("cfg-whats-display", whats.msg);
    const insta = normalizarInstagram($("cfg-insta").value);
    if (!insta.ok) mostrarErroCampo("cfg-insta", insta.msg);
    if (focarPrimeiroErro(form)) return;
    await ocupado(form, "Salvando…", () => api("config", "PUT", {
      company_name: $("cfg-nome").value, endereco: $("cfg-endereco").value,
      company_city: $("cfg-cidade").value, regiao_entrega: $("cfg-regiao").value,
      company_whatsapp: whats.valor, instagram_url: insta.valor, slogan: $("cfg-slogan").value,
    }));
    await carregarTudo(); renderConfig();
    toast("Configurações salvas");
  });
});

/* ---------- Inicialização ---------- */
(async () => {
  if (!token) { logout(); return; }
  try {
    /* "pedidos" exige login: valida o token antes de mostrar o painel */
    await api("pedidos");
  } catch { logout(); return; }
  /* E-mail vem do próprio token (já validado acima); se não der para ler, o campo fica vazio */
  try {
    const dados = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    $("email-usuario").textContent = dados.email || "";
  } catch { $("email-usuario").textContent = ""; }
  $("tela-login").style.display = "none";
  $("tela-painel").style.display = "flex";
  await carregarTudo(); trocarSecao("dashboard");
})();
