# Installation and Usage Guide — Fluxa

This document explains how to run Fluxa locally, configure the environment variables, and get the platform up and running end to end.

> To understand **what** Fluxa is and how it works conceptually, see the [README.md](./README.md).

---

## Prerequisites

Before you start, you need to have installed:

- **Node.js 20+**
- **pnpm** (package manager)
- **PostgreSQL** (database)

Check the versions:

```bash
node --version    # v20 or higher
pnpm --version
psql --version
```

---

## Overview of the applications

The project is split into three parts:

| Folder | What it is | Runs locally? |
|---|---|---|
| `fluxa-app` | Main application (website, dashboard, and API) | Yes — port `3000` |
| `fluxa-stellar` | Service that talks to the Stellar blockchain | Yes — port `3001` |
| `fluxa-contract` | Smart contract (Rust/Soroban) | Already deployed on the network; you only need its ID |

For day-to-day development, you run the **main application** and the **blockchain service**. The contract is already published on the test network — you just reference its ID in the environment variables.

---

## Step 1 — Database

Create a PostgreSQL database for the project. Example:

```bash
createdb fluxa
```

Save the connection string; you'll use it in the `DATABASE_URL` variable:

```
postgresql://user:password@localhost:5432/fluxa
```

---

## Step 2 — Configure the blockchain service (`fluxa-stellar`)

```bash
cd fluxa-stellar
pnpm install
```

Create a `.env` file inside `fluxa-stellar/` with the content below:

```env
# Port the service runs on
PORT=3001

# Private key of the "hot" wallet that sends the USDC
STELLAR_SECRET_KEY=your-stellar-private-key

# ID of the smart contract already deployed on the network
STELLAR_CONTRACT_ID=soroban-contract-id

# Network used: "testnet" (testing) or "public" (production)
STELLAR_NETWORK=testnet

# Shared secret between the two services (must be the
# SAME as the one configured in the main application)
STELLAR_SERVICE_SECRET=a-strong-shared-secret

# Reflector Network contract ID (on-chain dollar exchange rate)
REFLECTOR_CONTRACT_ID=reflector-contract-id
```

Start the service:

```bash
pnpm dev    # available at http://localhost:3001
```

---

## Step 3 — Configure the main application (`fluxa-app`)

```bash
cd fluxa-app
pnpm install
```

Create a `.env` file inside `fluxa-app/` with the content below:

```env
# PostgreSQL database connection
DATABASE_URL=postgresql://user:password@localhost:5432/fluxa

# Secret used to sign the login tokens (JWT)
JWT_SECRET=a-strong-secret-for-the-tokens

# Address of the blockchain service (Step 2)
STELLAR_SERVICE_URL=http://localhost:3001

# Shared secret — must be the SAME as in fluxa-stellar
STELLAR_SERVICE_SECRET=a-strong-shared-secret

# Payment gateway credentials (Asaas)
ASAAS_TOKEN_API=your-asaas-api-token
ASAAS_WEBHOOK_TOKEN=your-asaas-webhook-token

# Platform fee percentage (e.g. 10 = 10%)
NEXT_PUBLIC_FLUXA_FEE_PERCENT=10
```

Prepare the database (creates the tables):

```bash
npx prisma migrate dev
```

Start the application:

```bash
pnpm dev    # available at http://localhost:3000
```

---

## Step 4 — Run everything together

With the `.env` files configured, open two terminals:

```bash
# Terminal 1 — blockchain service
cd fluxa-stellar && pnpm dev

# Terminal 2 — main application
cd fluxa-app && pnpm dev
```

Access:

- **Platform:** http://localhost:3000
- **API documentation (Swagger):** http://localhost:3000/api/swagger

---

## Environment variables — full reference

### `fluxa-app`

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing login tokens |
| `STELLAR_SERVICE_URL` | Yes | URL where the blockchain service is running |
| `STELLAR_SERVICE_SECRET` | Yes | Shared secret between the two services |
| `ASAAS_TOKEN_API` | Yes | Access token for the Asaas API |
| `ASAAS_WEBHOOK_TOKEN` | Yes | Token that validates webhooks received from Asaas |
| `NEXT_PUBLIC_FLUXA_FEE_PERCENT` | Yes | Platform fee percentage (e.g. `10`) |

### `fluxa-stellar`

| Variable | Required | What it is |
|---|---|---|
| `PORT` | Yes | Service port (default `3001`) |
| `STELLAR_SECRET_KEY` | Yes | Private key of the wallet that sends the USDC |
| `STELLAR_CONTRACT_ID` | Yes | Smart contract ID on the Stellar network |
| `STELLAR_NETWORK` | Yes | Network used: `testnet` or `public` |
| `STELLAR_SERVICE_SECRET` | Yes | Shared secret (same as in `fluxa-app`) |
| `REFLECTOR_CONTRACT_ID` | Yes | Exchange-rate contract ID (Reflector Network) |

> ⚠️ **Important:** the `STELLAR_SERVICE_SECRET` must be **exactly the same** in both `.env` files. It's what authenticates communication between the main application and the blockchain service.

---

## Useful commands (`fluxa-app`)

```bash
pnpm dev                                  # Development server
pnpm build                                # Production build
pnpm lint                                 # Code linting (ESLint)

npx prisma migrate dev --name <name>      # Create a new database migration
npx prisma db push                        # Sync the schema without a migration
npx prisma generate                       # Regenerate the Prisma client
npx prisma studio                         # Open the visual database browser
```

---

## Common issues

**The application can't connect to the database.**
Check that PostgreSQL is running and that `DATABASE_URL` is correct (user, password, port, and database name).

**Authentication error between the services.**
Make sure `STELLAR_SERVICE_SECRET` is identical in both `.env` files.

**Payments aren't confirmed automatically.**
In a local environment, the Asaas webhook needs to be able to reach your machine. Use a tunneling tool (like `ngrok`) to expose port `3000` and configure that public URL in the Asaas dashboard.

**The tables don't exist in the database.**
Run `npx prisma migrate dev` inside `fluxa-app` to create the schema.
