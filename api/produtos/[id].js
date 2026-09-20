// PUT /api/produtos/:id — altera uma peça (precisa de login).
const db = require('../../lib/db');
const { validarAlteracao } = require('../../lib/produtos');
const { json, lerCorpo, metodo } = require('../../lib/http');
const { exigirLogin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'PUT')) return;
  if (!exigirLogin(req, res)) return;
  const id = Number((req.query && req.query.id) || (req.url.match(/\/api\/produtos\/(\d+)/) || [])[1]);
  if (!Number.isInteger(id)) return json(res, 400, { erro: 'Id inválido' });
  try {
    const atual = await db.buscar(id);
    if (!atual) return json(res, 404, { erro: 'Produto não encontrado' });
    const b = await lerCorpo(req);
    const { erro, dados } = validarAlteracao(atual, b);
    if (erro) return json(res, 400, { erro });
    json(res, 200, await db.atualizar(id, dados));
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Não foi possível salvar.' });
  }
};
