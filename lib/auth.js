// Login do painel: usuário e senha vêm das variáveis de ambiente (ADMIN_USUARIO / ADMIN_SENHA).
// A sessão é um cookie assinado (HMAC), válido por 30 dias. Nada fica guardado no banco.

const crypto = require('crypto');
const { cookies, ehHttps } = require('./http');

const NOME_COOKIE = 'sessao';
const DIAS = 30;

function configurado() {
  return !!(process.env.ADMIN_USUARIO && process.env.ADMIN_SENHA);
}

// Segredo derivado das credenciais: trocar a senha invalida as sessões antigas.
function segredo() {
  return crypto.createHash('sha256').update(`${process.env.ADMIN_USUARIO}:${process.env.ADMIN_SENHA}:desapegos`).digest();
}

function assinar(texto) {
  return crypto.createHmac('sha256', segredo()).update(texto).digest('base64url');
}

function iguais(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function credenciaisValidas(usuario, senha) {
  if (!configurado()) return false;
  return iguais(usuario, process.env.ADMIN_USUARIO) && iguais(senha, process.env.ADMIN_SENHA);
}

function criarSessao(req, res) {
  const expira = Date.now() + DIAS * 24 * 60 * 60 * 1000;
  const token = `${expira}.${assinar(String(expira))}`;
  const partes = [`${NOME_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${DIAS * 24 * 60 * 60}`];
  if (ehHttps(req)) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

function encerrarSessao(res) {
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function logado(req) {
  if (!configurado()) return false;
  const token = cookies(req)[NOME_COOKIE];
  if (!token) return false;
  const [expira, assinatura] = token.split('.');
  if (!expira || !assinatura || Number(expira) < Date.now()) return false;
  return iguais(assinatura, assinar(expira));
}

// Para rotas protegidas: responde 401 e devolve false se não estiver logado.
function exigirLogin(req, res) {
  if (logado(req)) return true;
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ erro: configurado() ? 'Faça login para continuar.' : 'Painel sem login configurado (ADMIN_USUARIO / ADMIN_SENHA).' }));
  return false;
}

module.exports = { configurado, credenciaisValidas, criarSessao, encerrarSessao, logado, exigirLogin };
