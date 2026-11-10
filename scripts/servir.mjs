// Servidor local mínimo para a pasta `out/` (o site estático gerado por `npm run build`).
//
// Por que existe: o site usa caminhos como /_next/..., que não funcionam ao abrir o index.html
// com duplo clique (file://). Este servidor não tem dependências: só o Node.js, sem internet.
// Escuta apenas em 127.0.0.1 (este computador), nunca na rede.
//
// Uso:  node scripts/servir.mjs [porta] [pasta]      (padrão: 3000 e ./out)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(process.argv[3] ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", "out"));
const porta = Number(process.argv[2] ?? process.env.PORT ?? 3000);

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/** Procura o arquivo da rota: /jogos → jogos.html ou jogos/index.html. Nega saídas da pasta. */
async function arquivoDe(caminhoUrl) {
  let relativo;
  try {
    relativo = normalize(decodeURIComponent(caminhoUrl)).replace(/^([/\\])+/, "");
  } catch {
    return null;
  }
  const candidatos = [relativo, `${relativo}.html`, join(relativo, "index.html")];
  // O Next pede os dados de pré-carregamento como "__next.jogos.__PAGE__.txt", mas a exportação
  // os salva em "__next.jogos/__PAGE__.txt". Sem este atalho a navegação ainda funciona, só que
  // sem o pré-carregamento (e com 404 no console do servidor).
  const dados = /^__next\.(.+)\.txt$/.exec(basename(relativo));
  if (dados?.[1].includes(".")) {
    const [primeiro, ...resto] = dados[1].split(".");
    candidatos.push(join(dirname(relativo), `__next.${primeiro}`, `${resto.join("/")}.txt`));
  }
  for (const candidato of candidatos) {
    const completo = resolve(raiz, candidato);
    if (completo !== raiz && !completo.startsWith(raiz + sep)) continue;
    try {
      if ((await stat(completo)).isFile()) return completo;
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

const servidor = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let arquivo = await arquivoDe(pathname);
  let status = 200;
  if (!arquivo) {
    arquivo = await arquivoDe("/404.html");
    status = 404;
  }
  if (!arquivo) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Não encontrado");
    return;
  }
  const corpo = await readFile(arquivo);
  res.writeHead(status, {
    "Content-Type": tipos[extname(arquivo)] ?? "application/octet-stream",
    "Content-Length": corpo.length,
    // Sem cache: depois de um novo build, o navegador sempre pega a versão atual.
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(req.method === "HEAD" ? undefined : corpo);
});

try {
  await stat(join(raiz, "index.html"));
} catch {
  console.error(`Não achei ${join(raiz, "index.html")}. Rode "npm run build" antes, para gerar a pasta out/.`);
  process.exit(1);
}

servidor.on("error", (erro) => {
  console.error(
    erro.code === "EADDRINUSE"
      ? `A porta ${porta} já está em uso. Feche o outro servidor ou use outra porta: node scripts/servir.mjs 3001`
      : String(erro),
  );
  process.exit(1);
});

servidor.listen(porta, "127.0.0.1", () => {
  console.log(`SmartHood AI no ar: http://localhost:${porta}`);
  console.log(`Servindo ${raiz}`);
  console.log("Para parar: Ctrl + C");
});
