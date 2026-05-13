export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startUsdcTransferWorker } = await import('./lib/queue')
    await startUsdcTransferWorker()
  }
}
