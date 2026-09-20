// POST /api/logout — encerra a sessão do painel.
const { json, metodo } = require('../lib/http');
const { encerrarSessao } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'POST')) return;
  encerrarSessao(res);
  json(res, 200, { ok: true });
};
