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
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USUARIO`, `ADMIN_SENHA`, `FOTOS_URL`, `FOTOS_SEGREDO`.

## Cadastrar peças novas (com foto)

No painel, clique em **+ Nova peça**, escolha a foto (do celular dá para tirar na hora), preencha nome, marca,
tamanho e preços e clique em **Cadastrar peça**. A foto é reduzida no próprio navegador (versão grande e miniatura)
e enviada para o armazenamento no Cloudflare R2. A peça entra no fim do catálogo com o próximo código de referência.
Para remover, use **Excluir** no card da peça (apaga a foto também).

Não precisa de `git push` nem de deploy para peças e fotos: tudo vai direto para o banco e para o R2.

## Onde ficam as fotos (Cloudflare R2)

As fotos ficam no bucket `desapego-fitness` do Cloudflare R2, entregues pelo Worker em `worker/fotos.js`.
O site e o painel falam com o Worker pelas variáveis `FOTOS_URL` (endereço público do Worker) e
`FOTOS_SEGREDO` (senha que autoriza gravar e apagar; a mesma definida no Worker).

- Publicar o Worker: `npm run fotos:publicar` (precisa do Wrangler logado na conta certa do Cloudflare).
- Definir o segredo no Worker (uma vez): `cd worker && wrangler secret put SEGREDO`.
- Migrar fotos de `public/img` e `public/thumb` para o R2: `npm run fotos:migrar`.

## Publicar mudanças de código no site

`npm run publicar` (commit e push) e depois `npm run deploy` (envia para a Vercel).

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
- `api/`: funções da Vercel (também usadas pelo servidor local): produtos (listar/cadastrar), produtos/[id] (editar/excluir), ordem, upload, login, logout, eu.
- `lib/`: acesso ao Supabase via REST (`db.js`), sessão por cookie assinado (`auth.js`), regras (`produtos.js`), fotos no R2 (`fotos.js`).
- `worker/`: Worker do Cloudflare que guarda e entrega as fotos do R2.
- `server.js`: servidor local que serve `public/` e roteia para `api/`.
- Banco: tabela `produtos` no Supabase, com RLS ativado (só a chave service_role, no servidor, acessa).
