// POST /api/sincronizar — cadastra fotos novas (precisa de login).
// A lista de fotos vem de /fotos.json, gerado pelo script "npm run fotos" a partir de public/img.
const { sincronizar } = require('../lib/produtos');
const { json, metodo, ehHttps } = require('../lib/http');
const { exigirLogin } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'POST')) return;
  if (!exigirLogin(req, res)) return;
  try {
    const base = `${ehHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
    const r = await fetch(`${base}/fotos.json?v=${Date.now()}`);
    if (!r.ok) return json(res, 500, { erro: 'Não achei a lista de fotos (fotos.json). Rode "npm run fotos" e publique.' });
    const arquivos = await r.json();
    json(res, 200, await sincronizar(arquivos));
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Não foi possível sincronizar as fotos.' });
  }
};
