
## PASSO 1: Criar a Organização e a Wallet Cripto

```bash
curl -X POST "https://api.sand.etherfuse.com/ramp/organization" \
  -H "Authorization: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "52dc481b-b067-4040-9447-1ea4c49c08fb",
    "displayName": "Fluxa",
    "accountType": "business",
    "wallets": [
      {
        "publicKey": "GB7C2EISSZDA44R2V2U5CNKGBBPZK6FF3K36EBZFQBQNFCKKIKXESEUR",
        "blockchain": "stellar"
      }
    ]
  }'
```

Resposta foi:
```json

{
    "organizationId": "52dc481b-b067-4040-9447-1ea4c49c08fb",
    "displayName": "Fluxa",
    "accountType": "business",
    "wallets": [
        {
            "walletId": "0f15082e-a6d7-4bc5-a0da-010eb59482fd",
            "customerId": "52dc481b-b067-4040-9447-1ea4c49c08fb",
            "createdAt": "2026-06-04T17:22:54.727367Z",
            "updatedAt": "2026-06-04T17:22:54.727367Z",
            "publicKey": "GB7C2EISSZDA44R2V2U5CNKGBBPZK6FF3K36EBZFQBQNFCKKIKXESEUR",
            "blockchain": "stellar",
            "kycStatus": "approved"
        }
    ]
}

```

`O CAMPO WalletId será a variável de ambiente: ETHERFUSE_WALLET_UUID`

### PASSO 2: Cadastrar a Conta Bancária (Sandbox)

```bash

curl -X POST "https://api.sand.etherfuse.com/ramp/customer/52dc481b-b067-4040-9447-1ea4c49c08fb/bank-account" \
  -H "Authorization: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "transactionId": "fe61d3ce-2a4f-4000-b8b3-9221d6151337",
      "name": "Fluxa",
      "countryIsoCode": "MX",
      "incorporatedDate": "20230101",
      "rfc": "XEX010101000",
      "clabe": "098765432109876543"
    },
    "bankAccountId": "13252c9b-3a2d-4285-8f50-a822fc4f08ae"
  }'
  

```

Resposta foi:

```json

{
    "bankAccountId": "13252c9b-3a2d-4285-8f50-a822fc4f08ae",
    "customerId": "52dc481b-b067-4040-9447-1ea4c49c08fb",
    "createdAt": "2026-06-04T17:33:55.693004Z",
    "updatedAt": "2026-06-04T17:33:55.816136Z",
    "currency": "mxn",
    "abbrClabe": "0987...6543",
    "etherfuseDepositClabe": "646180615200005435",
    "compliant": true,
    "needsWork": false,
    "status": "active"
}

```

`O `<UUID_DA_CONTA_BANCARIA>` que você enviou vai para "ETHERFUSE_BANK_ACCOUNT_UUID" `

