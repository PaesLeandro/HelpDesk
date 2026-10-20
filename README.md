# HelpDesk

Aplicação de chamados com três perfis: admin, técnico e cliente.

## Iniciar localmente

Em dois terminais PowerShell:

```powershell
cd backend/api
npm install
npm run db:setup
npm run dev
```

```powershell
cd HelpDesk
npm install
npm run dev
```

A API usa `http://localhost:3333` e o frontend usa a URL local mostrada pelo Vite. Para outra URL da API, defina `VITE_API_URL` no arquivo `HelpDesk/.env`. Em produção, defina `JWT_SECRET` e `DATABASE_URL`.

## Executar com Docker

Pré-requisitos: Docker Desktop iniciado.

```powershell
docker compose up --build
```

Aplicação: `http://localhost:8080`  
API: `http://localhost:3333/health`  
PostgreSQL: `localhost:5432`

O Compose cria o banco, aplica o schema Prisma, cria os dados de demonstração e inicia a API e o front-end. Para encerrar:

```powershell
docker compose down
```

Para apagar também os dados persistidos do banco:

```powershell
docker compose down -v
```

## Dados de demonstração

Para criar os dados de demonstração:

```powershell
cd backend/api
$env:DEMO_PASSWORD = "escolha-uma-senha-com-8-caracteres"
npm run seed:demo
```

Contas: `admin@helpdesk.local`, `tecnico1@helpdesk.local`, `tecnico2@helpdesk.local`, `tecnico3@helpdesk.local` e `cliente@helpdesk.local`. O cadastro público cria apenas clientes. Admin pode cadastrar técnicos e clientes pelo painel.

O banco Docker usa PostgreSQL. O modo local também exige um PostgreSQL acessível pela variável `DATABASE_URL`.

## Deploy do front-end no Vercel

No Vercel, importe o repositório e defina `HelpDesk` como **Root Directory**.

Configurações:

- Framework: Vite;
- Build command: `npm run build`;
- Output directory: `dist`;
- Install command: `npm install`;
- Variável de ambiente: `VITE_API_URL=https://URL-PUBLICA-DA-API`.

O arquivo [HelpDesk/vercel.json](HelpDesk/vercel.json) já configura o build e o fallback das rotas do React. O back-end precisa estar publicado separadamente, por exemplo no Render, e a URL dele deve ser informada em `VITE_API_URL`.

Nunca coloque `JWT_SECRET`, `DATABASE_URL` de produção ou senhas reais nas variáveis `VITE_*`, pois elas ficam disponíveis no navegador.

## Fluxos

- Admin: gerencia serviços, técnicos e clientes; consulta chamados.
- Técnico: vê chamados abertos sem responsável e os seus; inicia e encerra atendimentos.
- Cliente: abre chamados, vê o próprio histórico e os detalhes.

As rotas exigem autenticação, exceto `POST /users`, `POST /sessions` e `GET /health`.
