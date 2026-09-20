// Acesso ao banco (Supabase) pela API REST, sem bibliotecas.
// Usa a chave service_role, que só existe no servidor (variável de ambiente). Nunca vai para o navegador.

const URL_BASE = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !CHAVE) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente (.env local ou painel da Vercel).');
}

const CAMPOS = 'id,codigo,arquivo,nome,marca,tamanho,preco,preco_promocional,disponivel,ordem,atualizado_em';

async function rest(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE,
      Authorization: `Bearer ${CHAVE}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${texto.slice(0, 300)}`);
  return texto ? JSON.parse(texto) : null;
}

// Normaliza tipos: preços como número, disponível como booleano.
function normalizar(p) {
  return {
    ...p,
    preco: p.preco == null ? null : Number(p.preco),
    preco_promocional: p.preco_promocional == null ? null : Number(p.preco_promocional),
    disponivel: !!p.disponivel,
  };
}

async function listar() {
  const linhas = await rest(`produtos?select=${CAMPOS}&order=ordem.asc,id.asc`);
  return linhas.map(normalizar);
}

async function buscar(id) {
  const linhas = await rest(`produtos?select=${CAMPOS}&id=eq.${Number(id)}&limit=1`);
  return linhas[0] ? normalizar(linhas[0]) : null;
}

async function atualizar(id, dados) {
  const linhas = await rest(`produtos?id=eq.${Number(id)}&select=${CAMPOS}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...dados, atualizado_em: new Date().toISOString() }),
  });
  return linhas[0] ? normalizar(linhas[0]) : null;
}

async function inserir(dados) {
  const linhas = await rest(`produtos?select=${CAMPOS}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(dados),
  });
  return normalizar(linhas[0]);
}

// Grava a ordem: posição i para o id ids[i].
async function gravarOrdem(ids) {
  await Promise.all(ids.map((id, i) => rest(`produtos?id=eq.${Number(id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ordem: i }),
  })));
}

async function excluir(id) {
  await rest(`produtos?id=eq.${Number(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}

module.exports = { listar, buscar, atualizar, inserir, gravarOrdem, excluir };
