# MedAsset

Sistema para controle de equipamentos médico-hospitalares. Esta versão contém somente a fundação técnica, sem entidades, CRUD ou autenticação.

**Stack:** React, TypeScript e Vite no frontend; NestJS, TypeScript, PostgreSQL e Prisma 7 no backend; ESLint, Prettier e Jest.

## Execução local

Pré-requisitos: Node.js 24 (use `nvm use`, se disponível), npm e Docker com Compose.

Na raiz do projeto, prepare o PostgreSQL de desenvolvimento:

```bash
cp backend/.env.example backend/.env
# Substitua ALTERE_A_SENHA em POSTGRES_PASSWORD e DATABASE_URL pela mesma senha.
docker compose --env-file backend/.env up -d --wait
```

O banco `medasset` fica em `127.0.0.1:55432`, com dados persistidos em volume próprio. Se a senha contiver caracteres especiais, codifique-os na URL. As credenciais ficam somente no arquivo local `backend/.env`. Com um PostgreSQL próprio, ajuste `DATABASE_URL` e dispense o Compose.

Backend:

```bash
cd backend
npm ci
npm run prisma:validate
npm run prisma:conexao
npm run dev
```

A API escuta em `http://localhost:3000`, sem rotas cadastradas (`GET /` retorna 404). `PORT` define a porta e `FRONTEND_ORIGIN` deve conter a origem exata do frontend, sem barra final (exemplo: `http://localhost:5173`).

O Prisma lê `DATABASE_URL` de `backend/.env` por meio de `prisma.config.ts`. `prisma:validate` valida o schema; `prisma:conexao` executa `SELECT 1` no PostgreSQL pelo Prisma CLI. Ainda não há modelos, tabelas de aplicação, migrações ou cliente gerado. A API não abre conexão com o banco durante a inicialização.

Frontend, em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra `http://localhost:5173`. A porta é fixa para corresponder ao CORS; se estiver ocupada, libere-a antes de iniciar.

## Validação

Execute em cada pasta (`frontend` e `backend`):

```bash
npm run build
npm run lint
npm test
npm run format:check
npm audit --omit=dev
```

Use `npm run format` para formatar. Após o build, `npm run start:prod` executa o backend e `npm run preview` permite conferir o frontend compilado.

Para parar o banco preservando os dados, execute na raiz: `docker compose --env-file backend/.env down`.
