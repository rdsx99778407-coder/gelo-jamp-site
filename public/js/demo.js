/* ============================================================
   GELO JAMP — Site oficial (versão de produção)
   Distribuidora de Gelo em Jampruca - MG
   ============================================================ */

/* Configuração oficial — único local com dados da empresa */
const EMPRESA = {
  nome: "Distribuidora Gelo Jamp",
  endereco: "Rua Belo Horizonte, 87, Centro, Jampruca - MG, Brasil",
  cidade: "Jampruca - MG",
  regiao_entrega: "Jampruca e região",
  whatsapp_numero: "5533987046287",
  whatsapp_link: "https://wa.me/5533987046287",
  instagram_url: "https://www.instagram.com/gelo.jamp/",
  instagram_perfil: "@gelo.jamp",
  google_maps_link: "https://maps.app.goo.gl/Umq3PGaHRmf17bnr8",
  latitude: "-18.4609012",
  longitude: "-41.8069111",
  google_maps_dir: "https://www.google.com/maps/dir/?api=1&destination=-18.4609012%2C-41.8069111",
};

const CHAVES = {
  produtos: "gj_produtos",
  galeria: "gj_galeria",
  config: "gj_config",
  seed: "gj_seed_v1",
};

/* ---------------- Utilidades ---------------- */
const ler = (chave, padrao) => {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
};
const gravar = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));
const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let avisoTimer;
function toast(msg, duracao = 3200) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("mostrar");
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => t.classList.remove("mostrar"), duracao);
}

/* Preço sempre como "R$ 18,00", mesmo se foi gravado como "18" ou "R$ 18" */
function formatarPreco(p) {
  let t = String(p ?? "").replace(/R\$|\s/gi, "");
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && n > 0
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : `R$ ${String(p).replace(/^R\$\s*/i, "")}`;
}

/* ---------------- WhatsApp (geração centralizada) ---------------- */
function linkWhats(msg) {
  return `https://wa.me/${EMPRESA.whatsapp_numero}?text=${encodeURIComponent(msg)}`;
}
function linkWhatsGeral() {
  return linkWhats("Olá! Conheci a Gelo Jamp pelo site e gostaria de fazer um pedido.");
}
function linkWhatsProduto(nomeProduto) {
  return linkWhats(`Olá! Gostaria de fazer um pedido do produto ${nomeProduto}. Poderia me passar mais informações?`);
}
function linkWhatsEntrega() {
  return linkWhats("Olá! Gostaria de consultar a disponibilidade de entrega da Gelo Jamp para minha localização.");
}
function linkWhatsInfo() {
  return linkWhats("Olá! Acessei o site da Gelo Jamp e gostaria de obter mais informações.");
}
function linkComoChegar() {
  return EMPRESA.google_maps_dir;
}
function linkMapsOficial() {
  return EMPRESA.google_maps_link;
}

/* ---------------- Dados iniciais ---------------- */
const CONFIG_PADRAO = {
  company_name: EMPRESA.nome,
  endereco: EMPRESA.endereco,
  company_city: EMPRESA.cidade,
  regiao_entrega: EMPRESA.regiao_entrega,
  company_whatsapp: EMPRESA.whatsapp_numero,
  whatsapp_link: EMPRESA.whatsapp_link,
  instagram_url: EMPRESA.instagram_url,
  slogan: "Qualidade e frescor para seus melhores momentos!",
  descricao: "Gelo em cubos de água potável e filtrada e aluguel de cooler, com pedido direto pelo WhatsApp.",
};

const PRODUTOS_PADRAO = [
  {
    id: "p1",
    nome: "Gelo em Cubos",
    peso: "Saco 5 kg",
    descricao: "Gelo em cubos de uso alimentício, produzido com água potável e filtrada. Sem glúten, pronto para servir. Conservar entre -5 °C e -18 °C.",
    imagem: "img/gelo-5kg.jpeg",
    destaque: true,
    ativo: true,
  },
  {
    id: "p2",
    nome: "Gelo em Cubos",
    peso: "Saco 10 kg",
    descricao: "Água potável duplamente filtrada. Gelo puro e filtrado, com qualidade garantida para festas, bares e eventos.",
    imagem: "img/gelo-10kg.jpeg",
    destaque: true,
    ativo: true,
  },
  {
    id: "p3",
    nome: "Aluguel de Cooler",
    peso: "Gelo Jamp",
    descricao: "Alugue o seu cooler Gelo Jamp e mantenha as bebidas geladas em festas, churrascos e eventos. Fale conosco pelo WhatsApp.",
    imagem: "img/cooler-gelo-jamp.jpeg",
    destaque: true,
    ativo: true,
  },
];

const GALERIA_PADRAO = [
  { id: "g1", titulo: "Logotipo Gelo Jamp", categoria: "Marca", imagem: "img/logo-gelo-jamp.jpeg", ativa: true },
  { id: "g2", titulo: "Gelo em cubos, saco de 5 kg", categoria: "Produtos", imagem: "img/gelo-5kg.jpeg", ativa: true },
  { id: "g3", titulo: "Gelo em cubos, saco de 10 kg", categoria: "Produtos", imagem: "img/gelo-10kg.jpeg", ativa: true },
  { id: "g4", titulo: "Estrutura com freezer", categoria: "Estrutura", imagem: "img/estrutura-freezer.jpeg", ativa: true },
  { id: "g5", titulo: "Arte do cooler Gelo Jamp", categoria: "Campanhas", imagem: "img/cooler-gelo-jamp.jpeg", ativa: true },
];

function semear() {
  if (!localStorage.getItem(CHAVES.seed)) {
    gravar(CHAVES.config, CONFIG_PADRAO);
    gravar(CHAVES.produtos, PRODUTOS_PADRAO);
    gravar(CHAVES.galeria, GALERIA_PADRAO);
    localStorage.setItem(CHAVES.seed, "1");
  }
}

/* ---------------- Configurações vindas do painel ---------------- */
function formatarTelefone(digitos) {
  const d = String(digitos || "").replace(/\D/g, "");
  const m = d.match(/^(55)(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]}-${m[4]}` : d;
}
function aplicarConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return;
  const t = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
  if (t(cfg.company_name)) EMPRESA.nome = t(cfg.company_name);
  if (t(cfg.endereco)) EMPRESA.endereco = t(cfg.endereco);
  if (t(cfg.company_city)) EMPRESA.cidade = t(cfg.company_city);
  if (t(cfg.regiao_entrega)) EMPRESA.regiao_entrega = t(cfg.regiao_entrega);
  if (t(cfg.slogan)) EMPRESA.slogan = t(cfg.slogan);
  if (t(cfg.descricao)) EMPRESA.descricao = t(cfg.descricao);
  let fone = String(cfg.company_whatsapp || "").replace(/\D/g, "");
  if (fone.length === 10 || fone.length === 11) fone = "55" + fone;
  if (fone.length >= 12) {
    EMPRESA.whatsapp_numero = fone;
    EMPRESA.whatsapp_link = `https://wa.me/${fone}`;
  }
  const insta = t(cfg.instagram_url);
  /* Aceita o link, "instagram.com/perfil", "@perfil" ou só "perfil" */
  const perfil = insta && insta.match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i);
  if (perfil) {
    EMPRESA.instagram_url = `https://www.instagram.com/${perfil[1]}/`;
    EMPRESA.instagram_perfil = "@" + perfil[1];
  }
}

/* ---------------- Pedido pelo WhatsApp ---------------- */
function registrarPedido(produtoId) {
  /* Envio em segundo plano: não atrasa nem bloqueia a abertura do WhatsApp */
  try {
    fetch(`${API}?resource=pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoId }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* sem registro, o pedido segue pelo WhatsApp */ }
}

function pedirProduto(id) {
  const p = ler(CHAVES.produtos, []).find((x) => x.id === id);
  if (!p) return;
  /* O peso entra na mensagem: "Gelo em Cubos" existe em 5 kg e em 10 kg */
  const url = linkWhatsProduto(p.peso ? `${p.nome} (${p.peso})` : p.nome);
  registrarPedido(p.id);
  /* Fim da jornada: diz o que foi feito e o único passo que falta */
  toast(`Abrimos o WhatsApp com o pedido de ${p.nome}${p.peso ? ` (${p.peso})` : ""}. É só enviar a mensagem para confirmar.`, 7000);
  try {
    const nova = window.open(url, "_blank", "noopener,noreferrer");
    if (!nova) window.location.href = url;
  } catch {
    window.location.href = url;
  }
}

/* ============================================================
   API — dados persistentes (Netlify Functions + Turso)
   ============================================================ */
const API = "/.netlify/functions/api";

async function apiGet(resource) {
  try {
    const r = await fetch(`${API}?resource=${resource}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function aplicarProdutosDoBanco(lista) {
  return lista.map((p) => ({
    id: p.id, nome: p.nome, descricao: p.descricao, peso: p.peso,
    imagem: p.imagem, preco: p.preco, destaque: p.destaque, ativo: p.ativo,
  }));
}
function aplicarGaleriaDoBanco(lista) {
  return lista.map((g) => ({ id: g.id, titulo: g.titulo, categoria: g.categoria, imagem: g.imagem, ativa: g.ativa }));
}

async function carregarDados() {
  /* Busca só o que a página exibe: a configuração (contatos) vale para todas; produtos e galeria só onde aparecem */
  const temProdutos = document.querySelector("#grade-destaques, #grade-produtos");
  const temGaleria = document.getElementById("grade-galeria");
  const [prod, gal, cfg] = await Promise.all([
    temProdutos ? apiGet("produtos") : null,
    temGaleria ? apiGet("galeria") : null,
    apiGet("config"),
  ]);
  /* Lista vazia também é resposta válida (ex.: tudo excluído no painel) */
  if (Array.isArray(prod?.produtos)) gravar(CHAVES.produtos, aplicarProdutosDoBanco(prod.produtos));
  if (Array.isArray(gal?.fotos)) gravar(CHAVES.galeria, aplicarGaleriaDoBanco(gal.fotos));
  if (cfg?.config && typeof cfg.config === "object") {
    gravar(CHAVES.config, cfg.config);
    aplicarConfig(cfg.config);
  }
}

/* ---------------- Imagens ---------------- */
/* Arquivos de img/ que têm versão .webp. Outros caminhos (ou https://) usam a imagem original. */
const COM_WEBP = new Set(["img/gelo-5kg.jpeg", "img/gelo-10kg.jpeg", "img/cooler-gelo-jamp.jpeg", "img/estrutura-freezer.jpeg", "img/logo-gelo-jamp.jpeg"]);
const versaoWebp = (src) => (COM_WEBP.has(src) ? src.replace(/\.jpe?g$/i, ".webp") : null);
function imagemHTML(src, atributos) {
  const webp = versaoWebp(src);
  const img = `<img src="${esc(src)}" ${atributos}>`;
  return webp ? `<picture><source srcset="${esc(webp)}" type="image/webp">${img}</picture>` : img;
}

/* ---------------- Cartões ---------------- */
function cardProduto(p) {
  const preco = p.preco
    ? `<div class="preco">${esc(formatarPreco(p.preco))}</div>`
    : `<div class="preco">Consulte preço<small>via WhatsApp</small></div>`;
  return `
  <article class="card-produto">
    <div class="ft">
      ${imagemHTML(p.imagem || "img/gelo-5kg.jpeg", `alt="${esc(p.nome)}" width="800" height="640" loading="lazy"`)}    </div>
    <div class="cx">
      <h3>${esc(p.nome)}</h3>
      <div class="peso">${esc(p.peso || "")}</div>
      <p>${esc(p.descricao || "")}</p>
      <div class="rodape">
        ${preco}
        <button type="button" class="btn btn-whats btn-pedir" data-pedir="${esc(p.id)}" aria-label="Pedir ${esc(p.nome)} pelo WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Pedir pelo WhatsApp
        </button>
      </div>
    </div>
  </article>`;
}

/* Botão (e não <figure> clicável) para funcionar com teclado e leitores de tela */
function cardGaleria(g) {
  return `
  <button type="button" class="foto-g" data-lb="${esc(versaoWebp(g.imagem) || g.imagem)}" data-legenda="${esc(g.titulo)}" aria-label="Ampliar foto: ${esc(g.titulo)}">
    ${imagemHTML(g.imagem, `alt="" width="800" height="680" loading="lazy"`)}
    <span class="legenda" aria-hidden="true">${esc(g.titulo)}</span>
  </button>`;
}

/* ---------------- Elementos comuns ---------------- */
function preencherDados() {
  const texto = (sel, valor) => valor && document.querySelectorAll(sel).forEach((el) => (el.textContent = valor));
  document.querySelectorAll("[data-wa-geral]").forEach((a) => (a.href = linkWhatsGeral()));
  document.querySelectorAll("[data-wa-info]").forEach((a) => (a.href = linkWhatsInfo()));
  document.querySelectorAll("[data-wa-entrega]").forEach((a) => (a.href = linkWhatsEntrega()));
  document.querySelectorAll("[data-link-insta]").forEach((a) => (a.href = EMPRESA.instagram_url));
  document.querySelectorAll("[data-como-chegar]").forEach((a) => (a.href = linkComoChegar()));
  document.querySelectorAll("[data-maps-oficial]").forEach((a) => (a.href = linkMapsOficial()));
  texto("[data-cidade]", EMPRESA.cidade); /* n\u00E3o quebra de linha: [data-cidade] tem white-space:nowrap no CSS */
  texto("[data-regiao]", EMPRESA.regiao_entrega);
  /* Endereço: o trecho "Cidade - UF" fica num span sem quebra de linha (montado com textContent, sem HTML da configuração) */
  if (EMPRESA.endereco) document.querySelectorAll("[data-endereco]").forEach((el) => {
    el.textContent = "";
    for (const parte of EMPRESA.endereco.split(/(\S+ - \S+)/)) {
      if (!parte) continue;
      if (/\S+ - \S+/.test(parte)) {
        const s = document.createElement("span");
        s.className = "sem-quebra";
        s.textContent = parte;
        el.append(s);
      } else el.append(parte);
    }
  });
  texto("[data-whatsapp-display]", formatarTelefone(EMPRESA.whatsapp_numero));
  texto("[data-instagram]", EMPRESA.instagram_perfil);
  texto("[data-nome-empresa]", EMPRESA.nome);
  texto("[data-slogan]", EMPRESA.slogan);
  texto("[data-descricao]", EMPRESA.descricao);
}

function montarComuns() {
  preencherDados();

  /* Menu do celular/tablet: informa se está aberto e fecha com Esc ou ao escolher um link */
  const botaoMenu = document.querySelector(".menu-mobile");
  const menu = document.querySelector(".menu");
  const definirMenu = (aberto) => {
    menu.classList.toggle("aberto", aberto);
    botaoMenu.setAttribute("aria-expanded", String(aberto));
    botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };
  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", () => definirMenu(!menu.classList.contains("aberto")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) definirMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("aberto")) { definirMenu(false); botaoMenu.focus(); }
    });
  }

  /* Delegação de eventos: funciona para botões criados dinamicamente */
  document.addEventListener("click", (e) => {
    const btnPedir = e.target.closest("[data-pedir]");
    if (btnPedir) {
      e.preventDefault();
      pedirProduto(btnPedir.dataset.pedir);
      return;
    }
    const foto = e.target.closest("[data-lb]");
    if (foto) abrirLightbox(foto);
  });

  const lb = document.getElementById("lightbox");
  if (lb) {
    lb.querySelector(".fechar").addEventListener("click", fecharLightbox);
    lb.addEventListener("click", (e) => { if (e.target === lb) fecharLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("aberto")) return;
      if (e.key === "Escape") fecharLightbox();
      /* O único controle do diálogo é o botão fechar: o foco não sai dele */
      if (e.key === "Tab") { e.preventDefault(); lb.querySelector(".fechar").focus(); }
    });
  }
}

/* ---------------- Lightbox (diálogo acessível) ---------------- */
let origemLightbox = null;
function abrirLightbox(foto) {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  origemLightbox = foto;
  const img = lb.querySelector("img");
  img.src = foto.dataset.lb;
  img.alt = foto.dataset.legenda || "";
  lb.querySelector("figcaption").textContent = foto.dataset.legenda || "";
  lb.classList.add("aberto");
  document.documentElement.style.overflow = "hidden";
  lb.querySelector(".fechar").focus();
}
function fecharLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb || !lb.classList.contains("aberto")) return;
  lb.classList.remove("aberto");
  document.documentElement.style.overflow = "";
  /* Devolve o foco para a foto que abriu o diálogo */
  if (origemLightbox && document.contains(origemLightbox)) origemLightbox.focus();
  origemLightbox = null;
}

function renderDestaques() {
  const alvo = document.getElementById("grade-destaques");
  if (!alvo) return;
  alvo.innerHTML = ler(CHAVES.produtos, PRODUTOS_PADRAO).filter((p) => p.ativo && p.destaque).slice(0, 3).map((p) => cardProduto(p)).join("");
}
function renderCatalogo() {
  const alvo = document.getElementById("grade-produtos");
  if (!alvo) return;
  const lista = ler(CHAVES.produtos, PRODUTOS_PADRAO).filter((p) => p.ativo);
  alvo.innerHTML = lista.length
    ? lista.map((p) => cardProduto(p)).join("")
    : `<p style="grid-column:1/-1;color:var(--texto-suave)">Nenhum produto disponível no momento. Fale com a gente pelo WhatsApp para saber o que temos hoje.</p>`;
}
function renderGaleria() {
  const alvo = document.getElementById("grade-galeria");
  const filtros = document.getElementById("filtros-galeria");
  if (!alvo) return;
  const todas = ler(CHAVES.galeria, GALERIA_PADRAO).filter((g) => g.ativa);
  const cats = [...new Set(todas.map((g) => g.categoria))];
  if (filtros) {
    filtros.setAttribute("role", "group");
    filtros.setAttribute("aria-label", "Filtrar fotos por categoria");
    filtros.innerHTML = `<button type="button" class="filtro ativo" data-filtro="*" aria-pressed="true">Todas</button>` +
      cats.map((c) => `<button type="button" class="filtro" data-filtro="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("");
    /* onclick (e não addEventListener) para não acumular handlers a cada renderização */
    filtros.onclick = (e) => {
      const b = e.target.closest(".filtro");
      if (!b) return;
      filtros.querySelectorAll(".filtro").forEach((x) => { x.classList.remove("ativo"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("ativo");
      b.setAttribute("aria-pressed", "true");
      aplicarFiltro(b.dataset.filtro);
    };
  }
  function aplicarFiltro(cat) {
    alvo.innerHTML = (cat === "*" ? todas : todas.filter((g) => g.categoria === cat)).map((g) => cardGaleria(g)).join("");
  }
  aplicarFiltro("*");
}

/* ---------------- Mapa ---------------- */
function renderMapa() {
  const alvo = document.getElementById("mapa-embed");
  if (!alvo) return;
  const coords = `${EMPRESA.latitude},${EMPRESA.longitude}`;
  alvo.innerHTML = `
    <div class="mapa-wrapper">
      <iframe
        src="https://maps.google.com/maps?q=${coords}&z=17&output=embed"
        width="100%"
        height="380"
        style="border:0;border-radius:26px;"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Localização da Gelo Jamp em Jampruca - MG"
        allowfullscreen>
      </iframe>
    </div>`;
}

/* ---------------- Inicialização ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  semear();
  aplicarConfig(ler(CHAVES.config, null));
  montarComuns();
  renderDestaques();
  renderCatalogo();
  renderGaleria();
  renderMapa();
  await carregarDados();
  preencherDados();
  renderDestaques();
  renderCatalogo();
  renderGaleria();
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
});
