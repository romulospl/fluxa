import { useState } from 'react'
import { isAxiosError } from 'axios'

export function useApiMutation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (fn: () => Promise<void>) => {
    setIsLoading(true)
    setError(null)
    try {
      await fn()
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return { execute, isLoading, error, setError }
}

function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return err.response?.data?.error || 'Não foi possível concluir a operação. Tente novamente.'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Erro inesperado'
}
