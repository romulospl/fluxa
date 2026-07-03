#!/usr/bin/env bash
# ==============================================================================
# ETHERFUSE — ONRAMP BRL → USDC (Stellar / Sandbox)
# ==============================================================================
# Uso: ./etherfuse-onramp-usdc.sh
#
# ⚠️  ATENÇÃO: BRL → USDC direto não está documentado oficialmente.
#     Este script testa se a API aceita USDC como targetAsset de onramp com BRL.
#     Se a cotação falhar, o script exibirá o erro da API e encerrará.
#
# Dependências: curl, jq
# Instalar jq:
#   macOS:  brew install jq
#   Ubuntu: sudo apt install jq
# ==============================================================================

set -euo pipefail

# ==============================================================================
# CARREGAR VARIÁVEIS DE AMBIENTE (.env)
# ==============================================================================
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# ==============================================================================
# CONFIGURAÇÃO — PREENCHA OS CAMPOS NO ARQUIVO .env OU ABAIXO
# ==============================================================================

API_KEY="${API_KEY:-}"                  # Sua API Key do sandbox
WALLET_PUBLIC_KEY="${WALLET_PUBLIC_KEY:-}" # Chave pública Stellar (começa com G)
COMPANY_NAME="${COMPANY_NAME:-}"           # Nome da sua empresa
CLABE="${CLABE:-}"                  # CLABE de 18 dígitos (não inicie com 646)
COMPANY_FOUNDED="${COMPANY_FOUNDED:-}"                  # Data de abertura da empresa (YYYYMMDD)
AMOUNT_BRL="${AMOUNT_BRL:-}"                            # Valor em BRL a converter para USDC

# ==============================================================================
# CONFIGURAÇÃO FIXA — NÃO ALTERE
# ==============================================================================

BASE_URL="https://api.sand.etherfuse.com"
BLOCKCHAIN="stellar"
RFC_SANDBOX="XEX010101000"

# USDC na Stellar Sandbox (endereço oficial documentado pela Etherfuse)
TARGET_ASSET="USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

# Arquivo de estado — evita repetir o onboarding em execuções futuras
STATE_FILE=".etherfuse-usdc-state.json"

# ==============================================================================
# UTILITÁRIOS
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log_step()  { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
log_ok()    { echo -e "${GREEN}✔ $1${RESET}"; }
log_warn()  { echo -e "${YELLOW}⚠ $1${RESET}"; }
log_err()   { echo -e "${RED}✘ $1${RESET}"; }
log_info()  { echo -e "  $1"; }
log_json()  { echo -e "${BOLD}Resposta:${RESET}"; echo "$1" | jq .; }
separator() { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }

gen_uuid() {
  if command -v uuidgen &>/dev/null; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    cat /proc/sys/kernel/random/uuid
  fi
}

# Faz a requisição e trata o erro de forma legível
api_call() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local allow_errors="${4:-false}"
  local response http_code body_only

  if [ -n "$body" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "${BASE_URL}${path}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: ${API_KEY}" \
      "${BASE_URL}${path}")
  fi

  http_code=$(echo "$response" | tail -n1)
  body_only=$(echo "$response" | sed '$d')

  if [[ "$http_code" -lt 200 || "$http_code" -gt 299 ]]; then
    if [[ "$allow_errors" != "true" ]]; then
      log_err "HTTP $http_code em $method $path"
      local err_msg
      err_msg=$(echo "$body_only" | jq -r '.message // empty' 2>/dev/null || echo "")
      if [[ -n "$err_msg" ]]; then
        log_info "Detalhe do Erro: $err_msg"
      fi
      echo "$body_only" | jq . 2>/dev/null || echo "$body_only"
      exit 1
    fi
  fi

  echo "$body_only"
}

state_get() { jq -r ".${1} // empty" "$STATE_FILE" 2>/dev/null || echo ""; }
state_set() {
  local key="$1" value="$2" tmp
  tmp=$(mktemp)
  if [ -f "$STATE_FILE" ]; then
    jq --arg k "$key" --arg v "$value" '.[$k] = $v' "$STATE_FILE" > "$tmp"
  else
    jq -n --arg k "$key" --arg v "$value" '{($k): $v}' > "$tmp"
  fi
  mv "$tmp" "$STATE_FILE"
}

# ==============================================================================
# VALIDAÇÕES INICIAIS
# ==============================================================================

separator
echo -e "${BOLD}  ETHERFUSE — ONRAMP BRL → USDC (Stellar / Sandbox)${RESET}"
echo -e "${YELLOW}  ⚠  Fluxo não documentado oficialmente — testando suporte da API${RESET}"
separator

for dep in curl jq; do
  if ! command -v "$dep" &>/dev/null; then
    log_err "Dependência ausente: $dep"
    log_info "Instale com: brew install $dep (macOS) ou apt install $dep (Ubuntu)"
    exit 1
  fi
done
log_ok "Dependências OK (curl, jq)"

if [[ "$API_KEY" == "SEU_API_KEY_AQUI" || -z "$API_KEY" ]]; then
  log_err "Preencha o campo API_KEY no arquivo .env."
  exit 1
fi
if [[ "$WALLET_PUBLIC_KEY" == "SUA_WALLET_STELLAR_AQUI" || -z "$WALLET_PUBLIC_KEY" ]]; then
  log_err "Preencha o campo WALLET_PUBLIC_KEY no arquivo .env."
  exit 1
fi
if [[ ! "$WALLET_PUBLIC_KEY" =~ ^G ]]; then
  log_err "WALLET_PUBLIC_KEY inválida. Chaves Stellar devem começar com a letra G."
  exit 1
fi
if [[ ${#CLABE} -ne 18 ]]; then
  log_err "CLABE deve ter exatamente 18 dígitos. Atual: '${CLABE}' (${#CLABE} dígitos)."
  exit 1
fi
if [[ "$CLABE" =~ ^646 ]]; then
  log_err "CLABEs com prefixo 646 (STP) não são suportadas. Use outro banco."
  exit 1
fi

log_ok "Configuração validada"
log_info "Empresa:   $COMPANY_NAME"
log_info "Wallet:    $WALLET_PUBLIC_KEY"
log_info "CLABE:     ${CLABE:0:4}...${CLABE: -4}"
log_info "Valor:     R\$ $AMOUNT_BRL BRL"
log_info "Destino:   USDC (Stellar Sandbox)"

# ==============================================================================
# FASE 1 — ONBOARDING
# ==============================================================================

separator
echo -e "${BOLD}  FASE 1 — ONBOARDING DA EMPRESA${RESET}"
separator

ORG_UUID=$(state_get "org_uuid")
WALLET_UUID=$(state_get "wallet_uuid")
BANK_ACCOUNT_UUID=$(state_get "bank_account_uuid")

if [[ -n "$ORG_UUID" && -n "$WALLET_UUID" && -n "$BANK_ACCOUNT_UUID" ]]; then
  log_warn "Estado anterior encontrado em '$STATE_FILE'. Pulando onboarding."
  log_info "org_uuid:          $ORG_UUID"
  log_info "wallet_uuid:       $WALLET_UUID"
  log_info "bank_account_uuid: $BANK_ACCOUNT_UUID"
  log_info "Para refazer o onboarding, delete '$STATE_FILE' e execute novamente."
else

  # ── Passo 1: Criar organização ─────────────────────────────────────────────
  log_step "Passo 1/3 — Criando organização (business)"

  ORG_UUID=$(gen_uuid)
  BODY=$(jq -n \
    --arg id "$ORG_UUID" \
    --arg name "$COMPANY_NAME" \
    --arg pubkey "$WALLET_PUBLIC_KEY" \
    --arg chain "$BLOCKCHAIN" \
    '{
      id: $id,
      displayName: $name,
      accountType: "business",
      wallets: [{ publicKey: $pubkey, blockchain: $chain }]
    }')

  RESPONSE=$(api_call POST "/ramp/organization" "$BODY")
  log_json "$RESPONSE"

  WALLET_UUID=$(echo "$RESPONSE" | jq -r '.wallets[0].walletId')
  KYC_STATUS=$(echo "$RESPONSE" | jq -r '.wallets[0].kycStatus')

  if [[ "$WALLET_UUID" == "null" || -z "$WALLET_UUID" ]]; then
    log_err "Não foi possível extrair walletId da resposta."
    exit 1
  fi

  state_set "org_uuid" "$ORG_UUID"
  state_set "wallet_uuid" "$WALLET_UUID"
  log_ok "Organização criada"
  log_info "org_uuid:    $ORG_UUID"
  log_info "wallet_uuid: $WALLET_UUID"
  log_info "kycStatus:   $KYC_STATUS"

  # ── Passo 2: KYB ──────────────────────────────────────────────────────────
  log_step "Passo 2/3 — Verificando aprovação KYB"

  if [[ "$KYC_STATUS" == "approved" ]]; then
    log_ok "KYB aprovado automaticamente (sandbox)"
  else
    log_warn "kycStatus: $KYC_STATUS — aguardando 3s e verificando novamente..."
    sleep 3
    CHECK=$(api_call GET "/ramp/wallet/${WALLET_UUID}")
    KYC_STATUS=$(echo "$CHECK" | jq -r '.kycStatus')
    if [[ "$KYC_STATUS" != "approved" ]]; then
      log_err "Wallet ainda não aprovada (kycStatus: $KYC_STATUS)."
      exit 1
    fi
    log_ok "KYB aprovado"
  fi

  # ── Passo 3: Conta bancária ────────────────────────────────────────────────
  log_step "Passo 3/3 — Registrando conta bancária (CLABE)"

  BANK_ACCOUNT_UUID=$(gen_uuid)
  BANK_TX_UUID=$(gen_uuid)

  BODY=$(jq -n \
    --arg tx_id "$BANK_TX_UUID" \
    --arg name "$COMPANY_NAME" \
    --arg founded "$COMPANY_FOUNDED" \
    --arg rfc "$RFC_SANDBOX" \
    --arg clabe "$CLABE" \
    --arg bank_id "$BANK_ACCOUNT_UUID" \
    '{
      account: {
        transactionId: $tx_id,
        name: $name,
        countryIsoCode: "MX",
        incorporatedDate: $founded,
        rfc: $rfc,
        clabe: $clabe
      },
      bankAccountId: $bank_id
    }')

  RESPONSE=$(api_call POST "/ramp/customer/${ORG_UUID}/bank-account" "$BODY")
  log_json "$RESPONSE"

  STATUS=$(echo "$RESPONSE" | jq -r '.status')
  COMPLIANT=$(echo "$RESPONSE" | jq -r '.compliant')

  if [[ "$STATUS" != "active" || "$COMPLIANT" != "true" ]]; then
    log_err "Conta bancária não ficou ativa. status=$STATUS compliant=$COMPLIANT"
    exit 1
  fi

  state_set "bank_account_uuid" "$BANK_ACCOUNT_UUID"
  log_ok "Conta bancária registrada"
  log_info "bank_account_uuid: $BANK_ACCOUNT_UUID"
  log_info "status:    $STATUS"
  log_info "compliant: $COMPLIANT"
fi

# ==============================================================================
# FASE 2 — ONRAMP BRL → USDC
# ==============================================================================

separator
echo -e "${BOLD}  FASE 2 — ONRAMP  (R\$ $AMOUNT_BRL BRL → USDC)${RESET}"
separator

# ── Passo 4: Cotação ──────────────────────────────────────────────────────────
log_step "Passo 1/4 — Criando cotação BRL → USDC"
log_warn "Testando se a API aceita USDC como targetAsset de onramp com BRL..."

QUOTE_UUID=$(gen_uuid)
BODY=$(jq -n \
  --arg quote_id "$QUOTE_UUID" \
  --arg org_id "$ORG_UUID" \
  --arg chain "$BLOCKCHAIN" \
  --arg asset "$TARGET_ASSET" \
  --arg amount "$AMOUNT_BRL" \
  --arg wallet "$WALLET_PUBLIC_KEY" \
  '{
    quoteId: $quote_id,
    customerId: $org_id,
    blockchain: $chain,
    quoteAssets: {
      type: "onramp",
      sourceAsset: "BRL",
      targetAsset: $asset
    },
    sourceAmount: $amount,
    walletAddress: $wallet
  }')

RESPONSE=$(api_call POST "/ramp/quote" "$BODY" "true")
log_json "$RESPONSE"

# Verifica se a API retornou erro de asset não suportado
ERROR_TYPE=$(echo "$RESPONSE" | jq -r '.type // empty')
if [[ -n "$ERROR_TYPE" ]]; then
  log_err "API rejeitou a cotação: $ERROR_TYPE"
  log_info "Mensagem: $(echo "$RESPONSE" | jq -r '.message // empty')"
  log_warn "BRL → USDC direto não é suportado pela API."
  log_info "Alternativa: faça BRL → TESOURO (funciona) e depois TESOURO → USDC não existe via API."
  log_info "Outra alternativa: use o script etherfuse-onramp.sh para BRL → TESOURO."
  exit 1
fi

DESTINATION_AMOUNT=$(echo "$RESPONSE" | jq -r '.destinationAmount')
EXCHANGE_RATE=$(echo "$RESPONSE" | jq -r '.exchangeRate')
FEE_AMOUNT=$(echo "$RESPONSE" | jq -r '.feeAmount')
EXPIRES_AT=$(echo "$RESPONSE" | jq -r '.expiresAt')

log_ok "✅ API aceitou BRL → USDC! Cotação gerada com sucesso."
log_info "quoteId:     $QUOTE_UUID"
log_info "Envia:       R\$ $AMOUNT_BRL BRL"
log_info "Recebe:      $DESTINATION_AMOUNT USDC"
log_info "Taxa câmbio: $EXCHANGE_RATE"
log_info "Taxa serviço:R\$ $FEE_AMOUNT"
log_info "Expira em:   $EXPIRES_AT"
log_warn "Cotação expira em 2 minutos — criando ordem imediatamente..."

# ── Passo 5: Ordem ────────────────────────────────────────────────────────────
log_step "Passo 2/4 — Criando ordem"

ORDER_UUID=$(gen_uuid)
BODY=$(jq -n \
  --arg order_id "$ORDER_UUID" \
  --arg bank_id "$BANK_ACCOUNT_UUID" \
  --arg wallet_id "$WALLET_UUID" \
  --arg quote_id "$QUOTE_UUID" \
  '{
    orderId: $order_id,
    bankAccountId: $bank_id,
    cryptoWalletId: $wallet_id,
    quoteId: $quote_id
  }')

RESPONSE=$(api_call POST "/ramp/order" "$BODY")
log_json "$RESPONSE"

DEPOSIT_CLABE=$(echo "$RESPONSE" | jq -r '.onramp.depositClabe')
DEPOSIT_AMOUNT=$(echo "$RESPONSE" | jq -r '.onramp.depositAmount')
DEPOSIT_BANK=$(echo "$RESPONSE" | jq -r '.onramp.depositBankName')
DEPOSIT_HOLDER=$(echo "$RESPONSE" | jq -r '.onramp.depositAccountHolder')

log_ok "Ordem criada"
log_info "orderId:      $ORDER_UUID"
log_info "depositClabe: $DEPOSIT_CLABE"
log_info "depositAmount:R\$ $DEPOSIT_AMOUNT"
log_info "Banco:        $DEPOSIT_BANK / $DEPOSIT_HOLDER"
log_warn "Em PRODUÇÃO: transfira R\$ $DEPOSIT_AMOUNT exatamente para a CLABE acima."

# ── Passo 6: Simular depósito (sandbox) ──────────────────────────────────────
log_step "Passo 3/4 — Simulando depósito fiat (SANDBOX)"

BODY=$(jq -n --arg order_id "$ORDER_UUID" '{ orderId: $order_id }')
api_call POST "/ramp/order/fiat_received" "$BODY" > /dev/null
log_ok "Depósito fiat simulado — ordem avançando para 'funded'"

# ── Passo 7: Aguardar conclusão ───────────────────────────────────────────────
log_step "Passo 4/4 — Aguardando conclusão da ordem"

MAX_ATTEMPTS=15
WAIT_SECONDS=4
STATUS="created"

for i in $(seq 1 $MAX_ATTEMPTS); do
  sleep $WAIT_SECONDS
  RESPONSE=$(api_call GET "/ramp/order/${ORDER_UUID}")
  STATUS=$(echo "$RESPONSE" | jq -r '.status')
  log_info "Tentativa $i/$MAX_ATTEMPTS — status: ${BOLD}$STATUS${RESET}"

  if [[ "$STATUS" == "completed" ]]; then
    break
  elif [[ "$STATUS" == "failed" || "$STATUS" == "refunded" || "$STATUS" == "canceled" ]]; then
    log_err "Ordem encerrada com status inesperado: $STATUS"
    log_json "$RESPONSE"
    exit 1
  fi
done

# ==============================================================================
# RESULTADO FINAL
# ==============================================================================

separator
if [[ "$STATUS" == "completed" ]]; then
  echo -e "${GREEN}${BOLD}  ✔  ONRAMP BRL → USDC CONCLUÍDO COM SUCESSO!${RESET}"
  separator
  log_info "Ordem:      $ORDER_UUID"
  log_info "Convertido: R\$ $AMOUNT_BRL BRL → $DESTINATION_AMOUNT USDC"
  log_info "Wallet:     $WALLET_PUBLIC_KEY"

  CLAIM_TX=$(echo "$RESPONSE" | jq -r '.stellarClaimTransaction // empty')
  CLAIM_ID=$(echo "$RESPONSE" | jq -r '.stellarClaimableBalanceId // empty')

  if [[ -n "$CLAIM_TX" ]]; then
    echo ""
    log_warn "Ação necessária — Trustline / Claim (primeira vez recebendo USDC)"
    log_info "A sua wallet ainda não tem trustline para USDC."
    log_info "stellarClaimableBalanceId:"
    echo "  $CLAIM_ID"
    echo ""
    log_info "stellarClaimTransaction (XDR base64 — assine com sua wallet Stellar):"
    echo "  $CLAIM_TX"
    echo ""
    log_info "Exemplo com Stellar SDK (JS):"
    log_info "  const tx = TransactionBuilder.fromXDR(claimTransaction, networkPassphrase);"
    log_info "  tx.sign(userKeypair);"
    log_info "  await server.submitTransaction(tx);"
  else
    log_ok "USDC entregue diretamente na wallet (trustline já existente)."
  fi
else
  log_warn "Tempo esgotado. Último status: $STATUS"
  log_info "Verifique manualmente com:"
  log_info "  curl -H 'Authorization: $API_KEY' $BASE_URL/ramp/order/$ORDER_UUID | jq ."
fi

separator
echo -e "${BOLD}  IDs desta execução${RESET}"
separator
log_info "org_uuid:          $ORG_UUID"
log_info "wallet_uuid:       $WALLET_UUID"
log_info "bank_account_uuid: $BANK_ACCOUNT_UUID"
log_info "quote_uuid:        $QUOTE_UUID"
log_info "order_uuid:        $ORDER_UUID"
log_info "Estado salvo em:   $STATE_FILE"
separator
