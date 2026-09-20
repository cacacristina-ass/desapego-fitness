// PUT /api/ordem — grava a ordem das peças { ids: [...] } (precisa de login).
const db = require('../lib/db');
const { json, lerCorpo, metodo } = require('../lib/http');
const { exigirLogin } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'PUT')) return;
  if (!exigirLogin(req, res)) return;
  try {
    const b = await lerCorpo(req);
    const ids = Array.isArray(b.ids) ? b.ids.map(Number).filter(Number.isInteger) : [];
    if (!ids.length || new Set(ids).size !== ids.length) return json(res, 400, { erro: 'Lista de ids inválida' });
    await db.gravarOrdem(ids);
    json(res, 200, { ok: true, total: ids.length });
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Não foi possível salvar a ordem.' });
  }
};
