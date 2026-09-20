// Fotos no Cloudflare R2, via o Worker em worker/fotos.js.
// FOTOS_URL    = endereço público do Worker (ex.: https://desapego-fotos.xxx.workers.dev)
// FOTOS_SEGREDO = segredo para gravar/apagar (o mesmo definido no Worker com "wrangler secret put SEGREDO")

const BASE = (process.env.FOTOS_URL || '').replace(/\/$/, '');
const SEGREDO = process.env.FOTOS_SEGREDO || '';

function configurado() { return !!(BASE && SEGREDO); }

// Endereços públicos da foto de um produto.
function urls(arquivo) {
  const nome = encodeURIComponent(arquivo);
  return BASE
    ? { foto: `${BASE}/img/${nome}`, miniatura: `${BASE}/thumb/${nome}` }
    : { foto: `/img/${nome}`, miniatura: `/thumb/${nome}` }; // fallback: fotos locais em public/
}

async function enviar(tipo, arquivo, corpo, contentType = 'image/jpeg') {
  if (!configurado()) throw new Error('FOTOS_URL / FOTOS_SEGREDO não configurados.');
  const r = await fetch(`${BASE}/${tipo}/${encodeURIComponent(arquivo)}`, {
    method: 'PUT', body: corpo,
    headers: { Authorization: `Bearer ${SEGREDO}`, 'Content-Type': contentType },
  });
  if (!r.ok) throw new Error(`Falha ao enviar foto (${r.status}): ${(await r.text()).slice(0, 200)}`);
}

async function apagar(arquivo) {
  if (!configurado()) return;
  await Promise.all(['img', 'thumb'].map(tipo => fetch(`${BASE}/${tipo}/${encodeURIComponent(arquivo)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${SEGREDO}` },
  }).catch(() => null)));
}

// Nome de arquivo seguro e único para uma peça nova: "1758400000000_top-cinza.jpg"
function nomeArquivo(nome) {
  const slug = String(nome || 'peca').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'peca';
  return `${Date.now()}_${slug}.jpg`;
}

module.exports = { configurado, urls, enviar, apagar, nomeArquivo };
