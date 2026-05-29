# Fluxa

**Get paid in Brazilian reais and receive digital dollars in your wallet, automatically.**

Fluxa is a payment platform that connects the way Brazilians already pay — PIX and Boleto — to the world of cryptocurrencies. The merchant creates a charge in reais, the customer pays normally using whichever method they prefer, and Fluxa handles the rest: it converts the amount to **USDC** (a digital currency pegged to the US dollar) and deposits it directly into the merchant's wallet, with everything recorded transparently and auditable.

---

## Why does Fluxa exist?

Getting paid in crypto today is complicated: it requires technical knowledge, wallets, exchanges, and a lot of bureaucracy. On the other hand, the end customer wants to pay in the simplest way possible — and in Brazil that means PIX or Boleto.

Fluxa solves both sides:

- **For the customer:** they pay in reais, just like they always have. No deep knowledge of crypto required.
- **For the merchant:** they receive digital dollars (USDC), a stable store of value, without depending on an exchange and without needing to understand the technical side.

In between, Fluxa automatically bridges the two worlds.

---

## How it works, in practice

```
1. The merchant creates a charge in reais (e.g. R$ 100)
        ↓
2. Fluxa generates a payment link with PIX and Boleto
        ↓
3. The customer pays normally
        ↓
4. The payment is confirmed automatically
        ↓
5. The equivalent amount in digital dollars (USDC) is
   sent to the merchant's wallet
        ↓
6. Everything is recorded transparently and traceably
```


---

## What you can do with Fluxa

- **Create charges in reais** with the current dollar exchange rate
- **Share a public, simple payment link** with the customer
- **Get paid via PIX or Boleto**, with automatic payment confirmation
- **Receive digital dollars (USDC)** directly in your wallet, with no manual steps
- **Track everything from a dashboard** with statistics, charge history, and real-time exchange rates
- **View your wallet balance and statement** at any time
- **Transparency guaranteed:** every charge and every payment is recorded publicly and cannot be altered

---

## Transparency and security

Every charge and every status change is recorded on a public, immutable network (the Stellar blockchain). This means the history cannot be tampered with or erased — anyone can verify that a payment actually happened. It's an extra layer of trust for both the merchant and the payer.

Access to the platform is protected by secure login, and each merchant only sees their own charges and their own wallet.

---

## The lifecycle of a charge

Every charge goes through clear stages, and the merchant tracks each one of them in the dashboard:

| Status | What it means |
|---|---|
| **Pending** | Charge created, awaiting payment |
| **Paid** | Customer paid, confirmation received |
| **Transfer in progress** | The digital dollars are on their way to the wallet |
| **Completed** | Funds deposited into the merchant's wallet |
| **Overdue** | Payment deadline expired with no payment |

---

## How the project is organized

Fluxa is split into three parts that work together:

- **Main application** — the website and dashboard where the merchant creates charges, tracks payments, and manages their wallet. It's also where the public payment page that the customer accesses lives.
- **Blockchain service** — the part responsible for talking to the Stellar network: sending the digital dollars and recording information transparently.
- **Smart contract** — the public, immutable "vault" that stores the record of each charge on the blockchain, ensuring that nothing can be altered afterward.

---

## Core technologies

On the technical side, Fluxa is built with:

- **Next.js + React** for the interface and the API
- **PostgreSQL** as the database
- **Stellar** as the blockchain network, with **USDC** as the receiving currency
- **Asaas** as the payment gateway (PIX and Boleto)
- **Reflector Network** for the dollar exchange rate directly from the blockchain

---

## Running the project locally

Want to run Fluxa on your machine? The complete step-by-step — prerequisites, environment variable configuration, commands, and common troubleshooting — is in the dedicated guide:

👉 **[SETUP.md — Installation and Usage Guide](./SETUP.md)**

In short, the project has two applications that run together (the main application on port `3000` and the blockchain service on port `3001`). Once everything is configured, the platform is available at **http://localhost:3000** and the API documentation at **http://localhost:3000/api/swagger**.
