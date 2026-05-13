# Manual: Redeploy do Contrato Soroban

Use este guia sempre que precisar reimplantar o contrato `charge_registry` na testnet —
por exemplo, após trocar a carteira do app ou limpar o estado da blockchain.

---

## Por que fazer o redeploy?

O contrato armazena um **admin** (a carteira que pode registrar cobranças).
Quando você troca o `STELLAR_SECRET_KEY` no `fluxa-stellar`, a nova carteira não é
reconhecida como admin, e toda chamada ao contrato falha com erro de autorização.
O redeploy cria um contrato novo com a nova carteira como admin.

---

## Pré-requisitos

- Stellar CLI instalada (`stellar --version` deve funcionar)
- Rust + target `wasm32-unknown-unknown` instalado
- A carteira configurada em `fluxa-stellar/.env` deve ter **XLM na testnet** para pagar as taxas

---

## Passo 1 — Registre a carteira na Stellar CLI

A CLI precisa conhecer a chave para assinar as transações de deploy e init.

> **Carteira criada no Albedo?** O Albedo gera uma carteira Stellar padrão. A chave secreta
> que ele mostra (começa com `S`) é exatamente o `STELLAR_SECRET_KEY` do `fluxa-stellar/.env`.
> Não há nada especial a fazer — o processo abaixo é idêntico para qualquer carteira Stellar.

Se já existe uma identidade `fluxa-deployer` com a chave **antiga**, remova-a primeiro:

```bash
stellar keys rm fluxa-deployer
```

Agora cadastre a nova chave:

```bash
stellar keys add fluxa-deployer --secret-key
```

O comando vai pedir interativamente — você pode digitar:
- A **chave secreta** (`S...`): cole o valor de `STELLAR_SECRET_KEY` do `fluxa-stellar/.env`
- **ou** a **frase de recuperação** (12/24 palavras) da sua carteira Albedo

Pressione Enter após colar.

---

## Passo 2 — Confirme o endereço público

```bash
stellar keys address fluxa-deployer
```

Isso retorna o endereço público da carteira (começa com `G`).
Anote — ele será usado no Passo 6 como `<ADMIN_ADDRESS>`.

---

## Passo 3 — Garanta que a carteira tem XLM na testnet

Se não tiver saldo, use o faucet:

```bash
stellar keys fund fluxa-deployer --network testnet
```

---

## Passo 4 — Compile o contrato

Dentro de `fluxa-contract/`:

```bash
cd fluxa-contract
cargo build --target wasm32v1-none --release
```

O arquivo `.wasm` gerado estará em:

```
fluxa-contract/target/wasm32v1-none/release/charge_registry.wasm
```

---

## Passo 5 — Faça o deploy do contrato

Ainda dentro de `fluxa-contract/`:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/charge_registry.wasm \
  --source fluxa-deployer \
  --network testnet
```

O comando retornará um **novo Contract ID** — algo como:
```
CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Copie esse ID. Ele substituirá o `STELLAR_CONTRACT_ID` atual.

---

## Passo 6 — Inicialize o contrato (defina o admin)

Substitua `<ADMIN_ADDRESS>` pelo endereço público anotado no Passo 2
e `<CONTRACT_ID>` pelo ID obtido no Passo 5:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source fluxa-deployer \
  --network testnet \
  -- \
  init \
  --admin <ADMIN_ADDRESS>
```

Se retornar sem erro, o contrato está inicializado e pronto para uso.

---

## Passo 7 — Atualize o `.env` do fluxa-stellar

Abra `fluxa-stellar/.env` e substitua o valor de `STELLAR_CONTRACT_ID`:

```env
STELLAR_CONTRACT_ID=<CONTRACT_ID_NOVO>
```

---

## Passo 8 — Reinicie o fluxa-stellar

```bash
# na pasta fluxa-stellar/
pnpm run dev
```

---

## Verificação

Crie uma nova cobrança no fluxa-app. Nos logs do fluxa-stellar você deve ver:

```
[Stellar] charge <id> registrado: <txHash>
```

E **não** deve aparecer mais `Falha ao registrar charge`.

---

## Resumo rápido (quando já sabe o que está fazendo)

```bash
# 1. Atualizar identidade CLI
stellar keys rm fluxa-deployer
stellar keys add fluxa-deployer --secret-key

# 2. Compilar
cd fluxa-contract
cargo build --target wasm32-unknown-unknown --release

# 3. Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/charge_registry.wasm \
  --source fluxa-deployer \
  --network testnet

# 4. Init (substitua os valores)
stellar contract invoke \
  --id <NOVO_CONTRACT_ID> \
  --source fluxa-deployer \
  --network testnet \
  -- init --admin <ADMIN_ADDRESS>

# 5. Atualizar fluxa-stellar/.env com o novo STELLAR_CONTRACT_ID
```
