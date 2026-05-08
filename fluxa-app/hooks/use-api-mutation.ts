import { useState } from 'react'

export function useApiMutation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (fn: () => Promise<void>) => {
    setIsLoading(true)
    setError(null)
    try {
      await fn()
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return { execute, isLoading, error, setError }
}
