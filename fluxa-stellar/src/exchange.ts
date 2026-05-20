import { Account, Keypair, Networks, scValToNative, xdr } from '@stellar/stellar-sdk'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OracleClient } = require('@reflector/oracle-client')

const CONTRACT_ID = process.env.REFLECTOR_CONTRACT_ID!
const SOROBAN_RPC = process.env.REFLECTOR_RPC_URL ?? 'https://mainnet.sorobanrpc.com'

const DECIMALS = 14
const BRL = { type: 2, code: 'BRL' }

type SimResponse = {
  result?: { retval: xdr.ScVal }
  error?: string
}

let _client: {
  lastPrice(source: Account, asset: object, opts: object): Promise<SimResponse>
} | null = null

function getClient() {
  if (!_client) {
    _client = new OracleClient(Networks.PUBLIC, [SOROBAN_RPC], CONTRACT_ID)
  }
  return _client!
}

export async function getUsdcBrlRate(): Promise<number> {
  const source = new Account(Keypair.random().publicKey(), '0')
  const now = Math.floor(Date.now() / 1000)
  const sim = await getClient().lastPrice(source, BRL, {
    fee: '100',
    timebounds: { minTime: 0, maxTime: now + 60 },
    simulationOnly: true,
  })

  if (!sim || sim.error) throw new Error(`Reflector: ${sim?.error ?? 'sem resposta'}`)
  if (!sim.result) throw new Error('Reflector: preço BRL indisponível')

  const data = scValToNative(sim.result.retval) as { price: bigint; timestamp: bigint } | null
  if (!data) throw new Error('Reflector: preço BRL indisponível')

  // Oracle gives USD per BRL → invert to get BRL per USDC (USDC ≈ 1 USD)
  return 1 / (Number(data.price) / 10 ** DECIMALS)
}
