# Catálogo Desapegos Fitness

Catálogo online (Vercel) com painel de edição protegido por login e banco de dados no Supabase.
Não precisa instalar nada além do Node (versão 22 ou mais nova) e do ImageMagick (só para gerar as fotos).

## Endereços

- Catálogo: https://desapego-fitness.vercel.app
- Painel (login e senha): https://desapego-fitness.vercel.app/admin
- Localmente: `npm start` → http://localhost:3000 e http://localhost:3000/admin

Local e online usam o **mesmo banco**: o que você salvar num aparece no outro na hora.

## Painel

Cada peça tem os campos **nome, marca, tamanho, preço, preço promocional** e a caixa **Disponível**.
Preencha e clique em **Salvar** (ou aperte Enter). A caixa Disponível salva na hora.
Arraste a peça pela barra "⠿ arrastar" para mudar a ordem, ou use as setas ◀ ▶ (funcionam no celular).
O botão **Sair** encerra a sessão. A sessão dura 30 dias.

## Senhas e acessos

Ficam em `ACESSOS.md` e `.env` (os dois estão no `.gitignore` e nunca vão para o Git).
Online, as mesmas informações ficam nas variáveis de ambiente do projeto na Vercel:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USUARIO`, `ADMIN_SENHA`.

## Adicionar fotos novas

1. Coloque os PNG numa pasta ao lado de `catalogo` (ex.: `final4`). Se o nome do arquivo tiver a descrição
   (ex.: `03_jaqueta-azul_frente-costas.png`), a peça já entra com o nome "Jaqueta azul".
2. Gere as versões leves informando a pasta:

```
npm run fotos -- ../final4
```

3. Publique as fotos:

```
npm run publicar
```

4. No painel online, clique em **Buscar fotos novas**. As peças entram no fim do catálogo, com o próximo
   código de referência. (Rodando `npm start` localmente isso acontece sozinho ao iniciar.)

## Publicar mudanças no site

- Preços, nomes, ordem, vendido: **não precisa publicar nada**, já salva no banco.
- Fotos novas ou mudança no código: `npm run publicar` (commit e push). Se a Vercel não estiver ligada ao
  repositório, use `npm run deploy` (envia direto pela Vercel CLI).

## Código de referência

Cada peça recebe um código sequencial (001, 002, ...) ao ser cadastrada, mostrado como "REF 001".
Ele nunca muda. Fotos novas continuam a numeração.

## Botão do WhatsApp

Cada peça disponível tem o botão **Quero essa peça**, que abre o WhatsApp (51 98112-6240) com referência,
nome, marca, tamanho, preço e valor promocional. Para trocar o número, edite `const WHATSAPP` em `public/index.html`.

## Arte da oferta (imagem para postar)

Clicar na foto de uma peça abre uma arte quadrada (1080x1080) com foto, logo, referência, nome, marca,
tamanho e preços. **Download imagem** salva como JPG para postar.

## Logo

`public/logo.png` aparece no topo do catálogo, na tela de login e na arte da oferta.

## Como o site funciona (para quem for mexer no código)

- `public/`: catálogo, painel, fotos e estilo (arquivos estáticos).
- `api/`: funções da Vercel (também usadas pelo servidor local): produtos, ordem, sincronizar, login, logout, eu.
- `lib/`: acesso ao Supabase via REST (`db.js`), sessão por cookie assinado (`auth.js`), regras (`produtos.js`).
- `server.js`: servidor local que serve `public/` e roteia para `api/`.
- Banco: tabela `produtos` no Supabase, com RLS ativado (só a chave service_role, no servidor, acessa).
