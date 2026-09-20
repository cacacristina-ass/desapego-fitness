// Envia as fotos de public/img e public/thumb para o armazenamento (Worker + R2).
// Usa FOTOS_URL e FOTOS_SEGREDO do .env. Pula o que já existe lá.
// Uso: node --env-file=.env scripts/migrar-fotos.js

const fs = require('fs');
const path = require('path');
const fotos = require('../lib/fotos');

const RAIZ = path.resolve(__dirname, '..');

(async () => {
  if (!fotos.configurado()) { console.error('Defina FOTOS_URL e FOTOS_SEGREDO no .env'); process.exit(1); }
  const base = process.env.FOTOS_URL.replace(/\/$/, '');
  let enviados = 0, pulados = 0, erros = 0;
  for (const tipo of ['img', 'thumb']) {
    const pasta = path.join(RAIZ, 'public', tipo);
    if (!fs.existsSync(pasta)) continue;
    for (const nome of fs.readdirSync(pasta).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
      const existe = await fetch(`${base}/${tipo}/${encodeURIComponent(nome)}`, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
      if (existe) { pulados++; continue; }
      try {
        await fotos.enviar(tipo, nome, fs.readFileSync(path.join(pasta, nome)));
        enviados++;
        if (enviados % 20 === 0) console.log(`${enviados} enviadas...`);
      } catch (e) { erros++; console.error(`\nERRO ${tipo}/${nome}: ${e.message}`); }
    }
  }
  console.log(`\nEnviados: ${enviados} | já existiam: ${pulados} | erros: ${erros}`);
})();
