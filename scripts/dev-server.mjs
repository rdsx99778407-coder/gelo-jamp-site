/* ============================================================
   Servidor local de desenvolvimento — Gelo Jamp
   - Serve a pasta public/ em http://localhost:8888
   - Recarrega o navegador sozinho quando algum arquivo muda
   - Atende /.netlify/functions/api com a função real
     (precisa de TURSO_DATABASE_URL, TURSO_AUTH_TOKEN e ADMIN_SECRET
      no ambiente ou num arquivo .env na raiz do projeto)
   Uso: node scripts/dev-server.mjs
   ============================================================ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(raiz, "public");
const funcao = path.join(raiz, "netlify", "functions", "api.mjs");
const porta = Number(process.env.PORT) || 8888;

/* .env opcional (KEY=valor por linha) */
const envArq = path.join(raiz, ".env");
if (fs.existsSync(envArq)) {
  for (const linha of fs.readFileSync(envArq, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const tipos = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

/* ---------- Recarga automática (Server-Sent Events) ---------- */
const clientes = new Set();
const SCRIPT_RELOAD = `<script>(()=>{const es=new EventSource("/__reload");es.onmessage=()=>location.reload();})();</script>`;
let versaoFuncao = Date.now();
let timer;
function avisarMudanca(origem, arquivo) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (origem === "funcao") versaoFuncao = Date.now();
    console.log(`[mudança] ${origem}/${arquivo ?? ""} → recarregando ${clientes.size} aba(s)`);
    for (const res of clientes) res.write("data: reload\n\n");
  }, 120);
}
fs.watch(pub, { recursive: true }, (_e, arq) => avisarMudanca("public", arq));
fs.watch(path.dirname(funcao), { recursive: true }, (_e, arq) => avisarMudanca("funcao", arq));

/* ---------- Função da API (recarregada quando o arquivo muda) ---------- */
async function chamarApi(req, res, url) {
  const corpo = await new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => ok(d)); });
  try {
    const { handler } = await import(`${pathToFileURL(funcao).href}?v=${versaoFuncao}`);
    const r = await handler({
      httpMethod: req.method,
      queryStringParameters: Object.fromEntries(url.searchParams),
      headers: { ...req.headers, "x-nf-client-connection-ip": req.socket.remoteAddress },
      body: corpo || null,
    });
    res.writeHead(r.statusCode, r.headers || {});
    res.end(r.body ?? "");
  } catch (e) {
    console.error("[api]", e);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Erro ao carregar a função local" }));
  }
}

/* ---------- Servidor ---------- */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(": conectado\n\n");
    clientes.add(res);
    req.on("close", () => clientes.delete(res));
    return;
  }
  if (url.pathname === "/.netlify/functions/api") return chamarApi(req, res, url);

  let arquivo = path.normalize(path.join(pub, decodeURIComponent(url.pathname)));
  if (!arquivo.startsWith(pub)) { res.writeHead(403); return res.end("Proibido"); }
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, "index.html");
  if (!fs.existsSync(arquivo)) {
    /* Igual à Netlify: endereço inexistente mostra public/404.html com status 404 */
    const pagina404 = path.join(pub, "404.html");
    if (fs.existsSync(pagina404)) {
      const html = fs.readFileSync(pagina404, "utf8").replace("</body>", `${SCRIPT_RELOAD}
</body>`);
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(html);
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Não encontrado");
  }

  const ext = path.extname(arquivo).toLowerCase();
  const cabecalhos = { "Content-Type": tipos[ext] || "application/octet-stream", "Cache-Control": "no-store" };
  if (ext === ".html") {
    const html = fs.readFileSync(arquivo, "utf8");
    res.writeHead(200, cabecalhos);
    return res.end(html.includes("</body>") ? html.replace("</body>", `${SCRIPT_RELOAD}\n</body>`) : html + SCRIPT_RELOAD);
  }
  /* Pedidos parciais (Range): os navegadores usam para tocar e repetir vídeo, como a Netlify responde */
  const tamanho = fs.statSync(arquivo).size;
  const faixa = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (faixa) {
    let inicio = faixa[1] === "" ? Math.max(0, tamanho - Number(faixa[2])) : Number(faixa[1]);
    let fim = faixa[1] !== "" && faixa[2] !== "" ? Number(faixa[2]) : tamanho - 1;
    fim = Math.min(fim, tamanho - 1);
    if (inicio > fim || inicio >= tamanho) {
      res.writeHead(416, { "Content-Range": `bytes */${tamanho}` });
      return res.end();
    }
    res.writeHead(206, { ...cabecalhos, "Accept-Ranges": "bytes", "Content-Range": `bytes ${inicio}-${fim}/${tamanho}`, "Content-Length": fim - inicio + 1 });
    return fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
  }
  res.writeHead(200, { ...cabecalhos, "Accept-Ranges": "bytes", "Content-Length": tamanho });
  fs.createReadStream(arquivo).pipe(res);
}).listen(porta, () => {
  const banco = process.env.TURSO_DATABASE_URL ? "configurado" : "NÃO configurado (o site usa os dados padrão)";
  console.log(`Gelo Jamp em http://localhost:${porta}  —  banco: ${banco}`);
});
