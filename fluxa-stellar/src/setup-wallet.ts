import {
  Keypair,
  Networks,
  Asset,
  TransactionBuilder,
  Operation,
  Horizon,
} from '@stellar/stellar-sdk'

const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
}

const USDC_ISSUERS: Record<string, string> = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  mainnet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
}

const NETWORK_PASSPHRASES: Record<string, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
}

async function main() {
  const secretKey = process.env.STELLAR_SECRET_KEY
  const network = process.env.STELLAR_NETWORK ?? 'testnet'

  if (!secretKey) {
    console.error('STELLAR_SECRET_KEY não encontrado no .env')
    process.exit(1)
  }

  const keypair = Keypair.fromSecret(secretKey)
  const publicKey = keypair.publicKey()

  console.log('=== Carteira do App ===')
  console.log('Endereço público:', publicKey)
  console.log('Rede:', network)
  console.log()

  const server = new Horizon.Server(HORIZON_URLS[network])

  // Busca dados da conta
  let account
  try {
    account = await server.loadAccount(publicKey)
  } catch {
    console.error('Conta não encontrada na rede. Verifique se ela foi criada e tem XLM.')
    console.log()
    if (network === 'testnet') {
      console.log('Para criar e financiar no testnet, acesse:')
      console.log(`https://friendbot.stellar.org?addr=${publicKey}`)
    }
    process.exit(1)
  }

  // Mostra saldo atual
  console.log('=== Saldos Atuais ===')
  for (const balance of account.balances) {
    if (balance.asset_type === 'native') {
      console.log(`XLM: ${balance.balance}`)
    } else {
      // @ts-ignore
      console.log(`${balance.asset_code} (${balance.asset_issuer.slice(0, 8)}...): ${balance.balance}`)
    }
  }
  console.log()

  // Verifica se já tem trustline para USDC
  const usdcIssuer = USDC_ISSUERS[network]
  const hasUsdcTrustline = account.balances.some(
    // @ts-ignore
    (b) => b.asset_code === 'USDC' && b.asset_issuer === usdcIssuer
  )

  if (hasUsdcTrustline) {
    console.log('Trustline USDC: já configurada ✓')
    process.exit(0)
  }

  console.log('Trustline USDC: não configurada')
  console.log('Adicionando trustline USDC...')
  console.log()

  const usdc = new Asset('USDC', usdcIssuer)

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASES[network],
  })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(30)
    .build()

  tx.sign(keypair)

  const result = await server.submitTransaction(tx)
  console.log('Trustline adicionada com sucesso!')
  console.log('Hash da tx:', result.hash)
}

main().catch((err) => {
  console.error('Erro:', err?.message ?? err)
  process.exit(1)
})
