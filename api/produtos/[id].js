// PUT    /api/produtos/:id — altera uma peça (precisa de login).
// DELETE /api/produtos/:id — exclui a peça e apaga as fotos dela (precisa de login).
const db = require('../../lib/db');
const fotos = require('../../lib/fotos');
const { validarAlteracao } = require('../../lib/produtos');
const { json, lerCorpo, metodo } = require('../../lib/http');
const { exigirLogin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'PUT', 'DELETE')) return;
  if (!exigirLogin(req, res)) return;
  const id = Number((req.query && req.query.id) || (req.url.match(/\/api\/produtos\/(\d+)/) || [])[1]);
  if (!Number.isInteger(id)) return json(res, 400, { erro: 'Id inválido' });
  try {
    const atual = await db.buscar(id);
    if (!atual) return json(res, 404, { erro: 'Produto não encontrado' });

    if (req.method === 'DELETE') {
      await db.excluir(id);
      await fotos.apagar(atual.arquivo);
      return json(res, 200, { ok: true, id });
    }

    const b = await lerCorpo(req);
    const { erro, dados } = validarAlteracao(atual, b);
    if (erro) return json(res, 400, { erro });
    const salvo = await db.atualizar(id, dados);
    json(res, 200, { ...salvo, ...fotos.urls(salvo.arquivo) });
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Não foi possível salvar.' });
  }
};
