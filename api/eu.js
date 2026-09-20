// GET /api/eu — diz se há sessão ativa no painel.
const { json, metodo } = require('../lib/http');
const { logado, configurado } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'GET')) return;
  json(res, 200, { logado: logado(req), configurado: configurado() });
};
