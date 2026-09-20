// Catálogo Desapegos Fitness — servidor LOCAL.
// Serve a pasta public/ e as mesmas rotas de api/ que rodam na Vercel. O banco é o Supabase (ver .env).
// Uso: npm start  →  http://localhost:3000 (catálogo)  /  http://localhost:3000/admin (painel)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { sincronizar } = require('./lib/produtos');

const PORTA = Number(process.env.PORTA || 3000);
const PUBLIC = path.join(__dirname, 'public');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8',
};

// Mesmas funções da Vercel, roteadas à mão.
const rotas = [
  [/^\/api\/produtos$/, require('./api/produtos')],
  [/^\/api\/produtos\/(\d+)$/, require('./api/produtos/[id]'), m => ({ id: m[1] })],
  [/^\/api\/ordem$/, require('./api/ordem')],
  [/^\/api\/sincronizar$/, require('./api/sincronizar')],
  [/^\/api\/login$/, require('./api/login')],
  [/^\/api\/logout$/, require('./api/logout')],
  [/^\/api\/eu$/, require('./api/eu')],
];

function listaDeFotos() {
  const pasta = path.join(PUBLIC, 'img');
  return fs.existsSync(pasta) ? fs.readdirSync(pasta).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
}

function arquivoEstatico(res, caminhoRel) {
  const caminho = path.normalize(path.join(PUBLIC, caminhoRel));
  if (!caminho.startsWith(PUBLIC) || !fs.existsSync(caminho) || fs.statSync(caminho).isDirectory()) {
    res.writeHead(404); return res.end('Não encontrado');
  }
  const ext = path.extname(caminho).toLowerCase();
  res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' || ext === '.json' ? 'no-store' : 'public, max-age=86400' });
  fs.createReadStream(caminho).pipe(res);
}

const servidor = http.createServer(async (req, res) => {
  const rota = new URL(req.url, 'http://x').pathname;
  try {
    for (const [padrao, handler, params] of rotas) {
      const m = rota.match(padrao);
      if (m) { req.query = params ? params(m) : {}; return await handler(req, res); }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    if (rota === '/') return arquivoEstatico(res, 'index.html');
    if (rota === '/admin') return arquivoEstatico(res, 'admin.html');
    return arquivoEstatico(res, decodeURIComponent(rota));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Erro interno' }));
  }
});

(async () => {
  // Mantém fotos.json em dia e cadastra fotos novas no banco.
  const fotos = listaDeFotos();
  fs.writeFileSync(path.join(PUBLIC, 'fotos.json'), JSON.stringify(fotos));
  try {
    const r = await sincronizar(fotos);
    console.log(`Fotos: ${r.total} na pasta, ${r.novos} cadastradas agora.`);
  } catch (e) {
    console.error('Não consegui falar com o banco:', e.message);
  }
  servidor.listen(PORTA, () => {
    console.log(`Catálogo: http://localhost:${PORTA}`);
    console.log(`Painel:   http://localhost:${PORTA}/admin${process.env.ADMIN_SENHA ? '' : '  (ATENÇÃO: sem ADMIN_USUARIO/ADMIN_SENHA no .env, o login não funciona)'}`);
  });
})();
