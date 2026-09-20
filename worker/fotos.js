// Worker do Cloudflare que guarda as fotos no R2 e as entrega ao site.
//   GET  /img/<arquivo>    foto grande       (público, com cache de 1 ano)
//   GET  /thumb/<arquivo>  miniatura         (público)
//   PUT  /img|thumb/<arquivo>   grava   (precisa de "Authorization: Bearer <SEGREDO>")
//   DELETE /img|thumb/<arquivo> apaga   (idem)
// Publicar: npm run fotos:publicar   (na pasta catalogo)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const CHAVE_VALIDA = /^(img|thumb)\/[\w.\-]{1,120}\.(jpe?g|png|webp)$/i;

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const chave = decodeURIComponent(new URL(req.url).pathname.slice(1));
    if (!CHAVE_VALIDA.test(chave)) return resposta(404, 'Não encontrado');

    if (req.method === 'GET' || req.method === 'HEAD') {
      const obj = await env.FOTOS.get(chave);
      if (!obj) return resposta(404, 'Não encontrado');
      const cab = new Headers(CORS);
      cab.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
      cab.set('Cache-Control', 'public, max-age=31536000, immutable');
      cab.set('ETag', obj.httpEtag);
      cab.set('Content-Length', String(obj.size));
      return new Response(req.method === 'HEAD' ? null : obj.body, { headers: cab });
    }

    // Escrita: só com o segredo compartilhado com o servidor do catálogo.
    const auth = req.headers.get('Authorization') || '';
    if (!env.SEGREDO || auth !== `Bearer ${env.SEGREDO}`) return resposta(401, 'Não autorizado');

    if (req.method === 'PUT') {
      const tipo = req.headers.get('Content-Type') || 'image/jpeg';
      if (!/^image\//.test(tipo)) return resposta(415, 'Só aceito imagens');
      await env.FOTOS.put(chave, req.body, { httpMetadata: { contentType: tipo } });
      return resposta(200, JSON.stringify({ ok: true, chave }), 'application/json');
    }
    if (req.method === 'DELETE') {
      await env.FOTOS.delete(chave);
      return resposta(200, JSON.stringify({ ok: true, chave }), 'application/json');
    }
    return resposta(405, 'Método não permitido');
  },
};

function resposta(status, corpo, tipo = 'text/plain; charset=utf-8') {
  return new Response(corpo, { status, headers: { ...CORS, 'Content-Type': tipo } });
}
