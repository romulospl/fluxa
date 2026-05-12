# fluxa-stellar

Serviço intermediário que encapsula a integração com a rede Stellar/Soroban. O `fluxa-app` se comunica com este serviço via HTTP em vez de chamar o RPC Stellar diretamente.

## Pré-requisitos

- Node.js 20+
- pnpm

## Instalação

```bash
cd fluxa-stellar
pnpm install
```

## Configuração

Crie um arquivo `.env` na raiz do serviço (ou copie o existente):

```env
PORT=3001

# Stellar / Soroban
STELLAR_SECRET_KEY=<chave-secreta-da-conta-stellar>
STELLAR_CONTRACT_ID=<id-do-contrato-soroban>
STELLAR_NETWORK=testnet   # ou mainnet

# Segredo compartilhado com o fluxa-app
STELLAR_SERVICE_SECRET=<string-aleatoria-segura>
```

No `fluxa-app/.env`, configure o endereço deste serviço:

```env
STELLAR_SERVICE_URL=http://localhost:3001
STELLAR_SERVICE_SECRET=<mesmo-valor-acima>
```

## Rodando em desenvolvimento

```bash
pnpm dev
```

O servidor sobe em `http://localhost:3001` com hot-reload via `tsx watch`.

## Build e produção

```bash
pnpm build   # compila TypeScript para dist/
pnpm start   # executa dist/index.js
```

## Endpoints

Todas as rotas exigem o header `Authorization: Bearer <STELLAR_SERVICE_SECRET>`.

### `POST /charges`

Registra uma cobrança no contrato Soroban.

**Body:**
```json
{
  "id": "uuid-da-cobrança",
  "amountBrl": 150.00,
  "description": "Descrição da cobrança",
  "createdAt": "2026-05-12T00:00:00.000Z"
}
```

**Resposta 200:**
```json
{ "txHash": "abc123..." }
```

### `PATCH /charges/:id/status`

Atualiza o status de uma cobrança no contrato Soroban.

**Body:**
```json
{ "status": "paid" }
```

Valores aceitos: `pending`, `paid`, `cancelled`, `overdue`.

**Resposta 200:**
```json
{ "txHash": "abc123..." }
```

## Rodando junto com o fluxa-app

```bash
# Terminal 1
cd fluxa-stellar && pnpm dev

# Terminal 2
cd fluxa-app && pnpm dev
```
