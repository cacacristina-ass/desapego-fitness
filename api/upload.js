// PUT /api/upload?tipo=img|thumb&arquivo=nome.jpg — recebe a imagem (já redimensionada no navegador)
// e repassa ao Worker do R2. Precisa de login. Corpo: a imagem em si (image/jpeg).
const fotos = require('../lib/fotos');
const { json, metodo } = require('../lib/http');
const { exigirLogin } = require('../lib/auth');

const LIMITE = 4 * 1024 * 1024; // 4 MB (limite das funções da Vercel é 4,5 MB)

function lerBinario(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const partes = []; let total = 0;
    req.on('data', c => { total += c.length; if (total > LIMITE) { req.destroy(); reject(new Error('Imagem grande demais')); } else partes.push(c); });
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (!metodo(req, res, 'PUT')) return;
  if (!exigirLogin(req, res)) return;
  const url = new URL(req.url, 'http://x');
  const tipo = url.searchParams.get('tipo');
  const arquivo = url.searchParams.get('arquivo') || '';
  if (!['img', 'thumb'].includes(tipo) || !/^[\w.\-]{1,120}\.jpg$/i.test(arquivo)) return json(res, 400, { erro: 'Parâmetros inválidos' });
  if (!fotos.configurado()) return json(res, 500, { erro: 'Armazenamento de fotos não configurado (FOTOS_URL / FOTOS_SEGREDO).' });
  try {
    const corpo = await lerBinario(req);
    if (!corpo.length) return json(res, 400, { erro: 'Imagem vazia' });
    await fotos.enviar(tipo, arquivo, corpo, req.headers['content-type'] || 'image/jpeg');
    json(res, 200, { ok: true, arquivo, ...fotos.urls(arquivo) });
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: e.message || 'Falha no upload' });
  }
};
