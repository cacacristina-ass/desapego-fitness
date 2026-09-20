// POST /api/login { usuario, senha } — cria a sessão do painel.
const { json, lerCorpo, metodo } = require('../lib/http');
const { configurado, credenciaisValidas, criarSessao } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!metodo(req, res, 'POST')) return;
  if (!configurado()) return json(res, 500, { erro: 'Login não configurado: defina ADMIN_USUARIO e ADMIN_SENHA.' });
  const b = await lerCorpo(req).catch(() => ({}));
  if (!credenciaisValidas(String(b.usuario || ''), String(b.senha || ''))) {
    await new Promise(r => setTimeout(r, 400)); // freia tentativas de adivinhar
    return json(res, 401, { erro: 'Usuário ou senha incorretos.' });
  }
  criarSessao(req, res);
  json(res, 200, { ok: true });
};
