export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startUsdcTransferWorker, startHybridOnrampWorker } = await import('./lib/queue')
    await startUsdcTransferWorker()
    await startHybridOnrampWorker()
  }
}
