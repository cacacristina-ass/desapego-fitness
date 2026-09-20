// GET  /api/produtos — lista pública das peças (catálogo e painel).
// POST /api/produtos — cadastra uma peça nova (precisa de login). Corpo: { arquivo, nome, marca, tamanho, preco, preco_promocional }
const db = require('../lib/db');
const fotos = require('../lib/fotos');
const { validarAlteracao, proximoCodigo } = require('../lib/produtos');
const { json, lerCorpo, metodo } = require('../lib/http');
const { exigirLogin } = require('../lib/auth');

const comFotos = p => ({ ...p, ...fotos.urls(p.arquivo) });

module.exports = async (req, res) => {
  if (!metodo(req, res, 'GET', 'POST')) return;
  try {
    if (req.method === 'GET') {
      return json(res, 200, (await db.listar()).map(comFotos));
    }
    if (!exigirLogin(req, res)) return;
    const b = await lerCorpo(req);
    const arquivo = String(b.arquivo || '');
    if (!/^[\w.\-]{1,120}\.jpg$/i.test(arquivo)) return json(res, 400, { erro: 'Envie a foto antes de salvar.' });
    const { erro, dados } = validarAlteracao({ preco: null, preco_promocional: null }, b);
    if (erro) return json(res, 400, { erro });
    const existentes = await db.listar();
    if (existentes.some(p => p.arquivo === arquivo)) return json(res, 409, { erro: 'Essa foto já está cadastrada.' });
    const novo = await db.inserir({
      arquivo,
      codigo: proximoCodigo(existentes),
      ordem: existentes.reduce((m, p) => Math.max(m, p.ordem), -1) + 1,
      nome: dados.nome || 'Peça nova',
      marca: dados.marca || '', tamanho: dados.tamanho || '',
      preco: dados.preco ?? null, preco_promocional: dados.preco_promocional ?? null,
      disponivel: dados.disponivel ?? true,
    });
    json(res, 201, comFotos(novo));
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: req.method === 'GET' ? 'Não foi possível ler os produtos.' : 'Não foi possível cadastrar a peça.' });
  }
};
