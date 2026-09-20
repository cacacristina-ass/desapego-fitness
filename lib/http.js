// Ajudantes de HTTP que funcionam igual no servidor local (Node puro) e nas funções da Vercel.

function json(res, status, dados) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(dados));
}

// Lê o corpo JSON. Na Vercel o corpo pode já vir interpretado em req.body.
function lerCorpo(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body || '{}')); } catch { return Promise.resolve({}); } }
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', c => { dados += c; if (dados.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(dados ? JSON.parse(dados) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function cookies(req) {
  const saida = {};
  for (const par of (req.headers.cookie || '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0) saida[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
  }
  return saida;
}

function ehHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https';
}

function numeroOuNulo(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// Só aceita os métodos indicados; responde 405 para o resto.
function metodo(req, res, ...permitidos) {
  if (permitidos.includes(req.method)) return true;
  res.statusCode = 405; res.setHeader('Allow', permitidos.join(', ')); res.end();
  return false;
}

module.exports = { json, lerCorpo, cookies, ehHttps, numeroOuNulo, metodo };
