import {
  Keypair,
  Networks,
  rpc as SorobanRpc,
  Transaction,
  TransactionBuilder,
  xdr,
  nativeToScVal,
  Contract,
  Horizon,
  Asset,
  Operation,
} from '@stellar/stellar-sdk'
import crypto from 'crypto'

const RPC_URLS: Record<string, string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://rpc.stellar.org',
}

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

function getConfig() {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  const secretKey = process.env.STELLAR_SECRET_KEY
  const contractId = process.env.STELLAR_CONTRACT_ID

  if (!secretKey) throw new Error('STELLAR_SECRET_KEY não configurado')
  if (!contractId) throw new Error('STELLAR_CONTRACT_ID não configurado')

  return {
    rpcUrl: RPC_URLS[network],
    networkPassphrase: NETWORK_PASSPHRASES[network],
    contractId,
    keypair: Keypair.fromSecret(secretKey),
  }
}

function buildPayloadHash(charge: {
  id: string
  amountBrl: string | number
  description: string
  createdAt: Date
}): Buffer {
  const payload = JSON.stringify({
    id: charge.id,
    amountBrl: charge.amountBrl,
    description: charge.description,
    createdAt: charge.createdAt.toISOString(),
  })
  return crypto.createHash('sha256').update(payload).digest()
}

async function sendSorobanTx(
  server: SorobanRpc.Server,
  keypair: Keypair,
  tx: Transaction,
): Promise<string> {
  const simResult = await server.simulateTransaction(tx)

  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulação falhou: ${simResult.error}`)
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build()
  preparedTx.sign(keypair)

  const sendResult = await server.sendTransaction(preparedTx)

  if (sendResult.status === 'ERROR') {
    throw new Error(`Falha ao enviar tx: ${sendResult.errorResult?.toXDR('base64')}`)
  }

  const txHash = sendResult.hash
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    const result = await server.getTransaction(txHash)

    if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return txHash
    if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Tx falhou on-chain: ${txHash}`)
    }
  }

  throw new Error(`Timeout aguardando confirmação da tx: ${txHash}`)
}

export async function recordCharge(charge: {
  id: string
  userId: string
  number: number
  amountBrl: string | number
  description: string
  createdAt: Date
}): Promise<string> {
  const { rpcUrl, networkPassphrase, contractId, keypair } = getConfig()
  const server = new SorobanRpc.Server(rpcUrl)

  const account = await server.getAccount(keypair.publicKey())

  const amountCentavos = BigInt(Math.round(Number(charge.amountBrl) * 100))
  const chargeIdBytes = Buffer.from(charge.id)
  const payloadHash = buildPayloadHash(charge)

  const contract = new Contract(contractId)

  const operation = contract.call(
    'register',
    nativeToScVal(chargeIdBytes, { type: 'bytes' }),
    nativeToScVal(charge.userId, { type: 'string' }),
    nativeToScVal(charge.number, { type: 'u32' }),
    nativeToScVal(amountCentavos, { type: 'i128' }),
    xdr.ScVal.scvBytes(payloadHash),
  )

  const tx = new TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build()

  return sendSorobanTx(server, keypair, tx)
}

export async function transferUsdc(to: string, amount: string): Promise<string> {
  const network = process.env.STELLAR_NETWORK ?? 'testnet'
  const secretKey = process.env.STELLAR_SECRET_KEY
  if (!secretKey) throw new Error('STELLAR_SECRET_KEY não configurado')

  const keypair = Keypair.fromSecret(secretKey)
  const server = new Horizon.Server(HORIZON_URLS[network])
  const account = await server.loadAccount(keypair.publicKey())

  const usdc = new Asset('USDC', USDC_ISSUERS[network])

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASES[network],
  })
    .addOperation(Operation.payment({ destination: to, asset: usdc, amount }))
    .setTimeout(30)
    .build()

  tx.sign(keypair)

  const result = await server.submitTransaction(tx)
  return result.hash
}

export async function updateChargeStatus(
  chargeId: string,
  status: 'pending' | 'paid' | 'cancelled' | 'overdue',
): Promise<string> {
  const { rpcUrl, networkPassphrase, contractId, keypair } = getConfig()
  const server = new SorobanRpc.Server(rpcUrl)

  const account = await server.getAccount(keypair.publicKey())

  const chargeIdBytes = Buffer.from(chargeId)
  const contract = new Contract(contractId)

  const operation = contract.call(
    'update_status',
    nativeToScVal(chargeIdBytes, { type: 'bytes' }),
    nativeToScVal(status, { type: 'symbol' }),
  )

  const tx = new TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build()

  return sendSorobanTx(server, keypair, tx)
}
