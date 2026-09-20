// GET /api/produtos — lista pública das peças (catálogo e painel).
const db = require('../lib/db');
const { json, metodo } = require('../lib/http');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'GET')) return;
  try {
    json(res, 200, await db.listar());
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Não foi possível ler os produtos.' });
  }
};
