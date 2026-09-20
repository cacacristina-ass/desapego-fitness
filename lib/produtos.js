// Regras de negócio dos produtos (usadas pelas rotas).

const db = require('./db');
const { numeroOuNulo } = require('./http');

// Nome inicial a partir do arquivo: "03_jaqueta-azul_frente-costas.jpg" -> "Jaqueta azul".
// Arquivos sem descrição (ex.: "01_IMG_5354_5355_frente-costas.jpg") viram "Peça N".
function nomeInicial(arquivo, n) {
  const partes = arquivo.replace(/\.[^.]+$/, '').split('_')
    .filter(p => p && !/^\d+$/.test(p) && !/^img$/i.test(p) && !/^(frente|costas|frente-costas|individual)$/i.test(p));
  const texto = partes.join(' ').replace(/-/g, ' ').trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : `Peça ${n}`;
}

// Próximo código de referência (001, 002, ...).
function proximoCodigo(existentes) {
  const ultimo = existentes.reduce((m, p) => Math.max(m, Number(p.codigo) || 0), 0);
  return String(ultimo + 1).padStart(3, '0');
}

// Cadastra as fotos que ainda não existem no banco, no fim da ordem, com código sequencial.
async function sincronizar(arquivos) {
  const existentes = await db.listar();
  const conhecidos = new Set(existentes.map(p => p.arquivo));
  let ordem = existentes.reduce((m, p) => Math.max(m, p.ordem), -1);
  let ultimoCodigo = existentes.reduce((m, p) => Math.max(m, Number(p.codigo) || 0), 0);
  let novos = 0;
  for (const arquivo of [...arquivos].sort()) {
    if (conhecidos.has(arquivo)) continue;
    ordem++; ultimoCodigo++;
    await db.inserir({
      arquivo,
      codigo: String(ultimoCodigo).padStart(3, '0'),
      nome: nomeInicial(arquivo, ultimoCodigo),
      ordem,
    });
    novos++;
  }
  return { novos, total: arquivos.length };
}

// Monta os campos a gravar a partir do que veio do formulário. Devolve { erro } se inválido.
function validarAlteracao(atual, b) {
  const dados = {};
  if ('nome' in b) dados.nome = String(b.nome).trim();
  if ('marca' in b) dados.marca = String(b.marca).trim();
  if ('tamanho' in b) dados.tamanho = String(b.tamanho).trim();
  if ('preco' in b) dados.preco = numeroOuNulo(b.preco);
  if ('preco_promocional' in b) dados.preco_promocional = numeroOuNulo(b.preco_promocional);
  if ('disponivel' in b) dados.disponivel = !!b.disponivel;

  const preco = 'preco' in dados ? dados.preco : atual.preco;
  const promo = 'preco_promocional' in dados ? dados.preco_promocional : atual.preco_promocional;
  if (promo !== null && preco !== null && promo >= preco) {
    return { erro: 'O preço promocional precisa ser menor que o preço normal.' };
  }
  return { dados };
}

module.exports = { nomeInicial, sincronizar, validarAlteracao, proximoCodigo };
