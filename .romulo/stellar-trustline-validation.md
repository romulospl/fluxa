# Validação de Trustline USDC em Carteiras Stellar

## Contexto

Ao cadastrar uma carteira Stellar no sistema, é necessário garantir que ela tenha o **trustline do USDC ativado**. Sem isso, a carteira não consegue receber USDC — qualquer tentativa de depósito falhará.

---

## Abordagem Correta: Consultar a Horizon API

A Stellar disponibiliza a **Horizon API** (indexador REST sobre a rede Stellar) que permite consultar o estado de qualquer account, incluindo seus trustlines, **sem fazer nenhuma transação**.

### Endpoint

```
GET https://horizon.stellar.org/accounts/{wallet_address}
```

Se a carteira não existir na rede (ainda não foi fundeada com o mínimo de XLM), a API retorna **404** — o que também é um estado inválido.

### O que verificar na resposta

O campo `balances` lista todos os trustlines ativos. Para confirmar que o USDC está habilitado, procure uma entrada com:

- `asset_code` === `"USDC"`
- `asset_issuer` === `"GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"` (issuer oficial da Circle no mainnet)

### Exemplo de resposta com trustline ativo

```json
{
  "balances": [
    {
      "balance": "0.0000000",
      "asset_type": "credit_alphanum4",
      "asset_code": "USDC",
      "asset_issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      "limit": "922337203685.4775807"
    },
    {
      "asset_type": "native",
      "balance": "1.5000000"
    }
  ]
}
```

---

## URLs da Horizon por rede

| Rede | Base URL |
|------|----------|
| Mainnet | `https://horizon.stellar.org` |
| Testnet | `https://horizon-testnet.stellar.org` |

## Exemplo com cURL

### Testnet

```bash
curl -s "https://horizon-testnet.stellar.org/accounts/{WALLET_ADDRESS}" \
  | jq '.balances[] | select(.asset_code == "USDC")'
```

Para ver todos os balances:

```bash
curl -s "https://horizon-testnet.stellar.org/accounts/{WALLET_ADDRESS}" | jq '.balances'
```

### Mainnet

```bash
curl -s "https://horizon.stellar.org/accounts/{WALLET_ADDRESS}" \
  | jq '.balances[] | select(.asset_code == "USDC")'
```

Se retornar um objeto, o trustline está ativo. Se retornar vazio, não está.

---

## Issuer USDC (Circle) por rede

| Rede | Issuer |
|------|--------|
| Mainnet | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| Testnet | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

---

## Comparação de abordagens

| | Enviar USDC de teste | Consultar Horizon API |
|---|---|---|
| Custo | USDC real gasto | Gratuito |
| Transação on-chain | Sim | Não |
| Velocidade | Lenta (aguarda confirmação) | ~200ms (HTTP GET) |
| Determinístico | Não (pode falhar por outros motivos) | Sim |
| Implementação | Complexa | Simples |

---

## Quando validar

### 1. No cadastro da carteira (onboarding)

Ponto de entrada: `POST /api/users` (registro) — a carteira é informada junto com os demais dados do usuário.

- Antes de criar o usuário no banco, chamar a Horizon API para validar o endereço.
- Se a account não existir na rede (404): retornar erro `"Carteira Stellar não encontrada na rede. Certifique-se de que a conta foi ativada com XLM."`.
- Se existir mas não tiver trustline USDC: retornar erro `"A carteira não possui trustline de USDC ativo. Ative o trustline para USDC (Circle) antes de cadastrar."`.
- Somente prosseguir com o `INSERT` se a validação passar.

### 2. Na alteração da carteira

Ponto de entrada: `PATCH /api/users/wallet` — usuário troca o endereço da carteira cadastrada.

- Mesma lógica de validação do item 1, executada antes de atualizar o registro no banco.
- Mesmas mensagens de erro, mesmos status HTTP (`400`).
- Não há necessidade de cache neste fluxo (operação pontual, feita pelo usuário manualmente).

---

## Mensagens de erro padronizadas

| Situação | Mensagem |
|---|---|
| Account não existe (404 na Horizon) | `"Carteira Stellar não encontrada na rede. Certifique-se de que a conta foi ativada com XLM."` |
| Account existe, sem trustline USDC | `"A carteira não possui trustline de USDC ativo. Ative o trustline para USDC (Circle) antes de cadastrar."` |

Ambos retornam HTTP `400`.

---

## Onde implementar a lógica

Criar uma função utilitária isolada (ex: `lib/stellar.ts`) com a assinatura:

```typescript
export async function validateUsdcTrustline(walletAddress: string): Promise<void>
// Lança Error com a mensagem apropriada se inválido; retorna void se válido.
```

Essa função é chamada tanto em `registerUser` quanto em `updateWalletAddress`, antes de qualquer operação no banco.

---

## Fontes

- Documentação oficial da Horizon API: https://developers.stellar.org/network/horizon
- Referência do endpoint de accounts: https://developers.stellar.org/network/horizon/resources/accounts/object
- Stellar Expert (explorador de rede): https://stellar.expert/explorer/public
