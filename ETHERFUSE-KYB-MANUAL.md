# Como Fazer o KYB da Etherfuse Manualmente via cURL

Como a Etherfuse permite que você **crie e envie os seus próprios IDs** (UUID v4) durante a criação, o processo é bem simples. Você vai gerar os IDs na sua máquina, enviar para a API da Etherfuse via `curl` e, dando sucesso, você cola esses mesmos IDs no seu arquivo `.env`.

> [!NOTE]
> Você precisará de 4 UUIDs (versão 4) gerados aleatoriamente.

Substitua as variáveis nos comandos abaixo (`SEU_TOKEN`, `SEU_UUID_GERADO...`) pelos seus dados reais.

---

### Passo 1: Criar a Organização e a Wallet Cripto

Você precisará de 1 UUID para ser o ID da sua Organização.

**O que vai no `.env` depois:**
- O `<UUID_DA_ORG>` vai para `ETHERFUSE_ORG_UUID`.
- O ID da Wallet será retornado na resposta, e vai para `ETHERFUSE_WALLET_UUID`.

```bash
curl -X POST "https://api.sand.etherfuse.com/ramp/organization" \
  -H "Authorization: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<UUID_DA_ORG>",
    "displayName": "Fluxa",
    "accountType": "business",
    "wallets": [
      {
        "publicKey": "GB...SUA_CHAVE_PUBLICA_STELLAR...",
        "blockchain": "stellar"
      }
    ]
  }'
```

**Resultado Esperado:** 
A resposta vai te devolver um JSON confirmando a criação. Procure pelo campo `walletId` dentro do array `wallets` na resposta. Esse será o seu `ETHERFUSE_WALLET_UUID`.

---

### Passo 2: Cadastrar a Conta Bancária (Sandbox)

Você precisará de **dois UUIDs novos** agora: um para a transação (`transactionId`) e outro para a conta em si (`bankAccountId`).

**O que vai no `.env` depois:**
- O `<UUID_DA_CONTA_BANCARIA>` que você enviou vai para `ETHERFUSE_BANK_ACCOUNT_UUID`.

```bash
curl -X POST "https://api.sand.etherfuse.com/ramp/customer/<UUID_DA_ORG_DO_PASSO_1>/bank-account" \
  -H "Authorization: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "transactionId": "<UUID_DA_TRANSACAO>",
      "name": "Fluxa",
      "countryIsoCode": "MX",
      "incorporatedDate": "20230101",
      "rfc": "XEX010101000",
      "clabe": "098765432109876543"
    },
    "bankAccountId": "<UUID_DA_CONTA_BANCARIA>"
  }'
```

**Resultado Esperado:** 
A API vai retornar que o `status` está `active` e `compliant: true`. 

---

### Resumo do `.env`

Após rodar esses dois comandos com sucesso, basta ir no seu `fluxa-app/.env` e colocar:

```env
ETHERFUSE_API_KEY="SEU_TOKEN"
ETHERFUSE_ORG_UUID="<UUID_DA_ORG_DO_PASSO_1>"
ETHERFUSE_WALLET_UUID="<walletId_retornado_no_passo_1>"
ETHERFUSE_BANK_ACCOUNT_UUID="<UUID_DA_CONTA_BANCARIA_DO_PASSO_2>"
```
