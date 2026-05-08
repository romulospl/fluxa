import { useState } from 'react'

type CepResult = {
  street: string
  neighborhood: string
  city: string
  state: string
}

export function useCepLookup() {
  const [isFetching, setIsFetching] = useState(false)

  const lookup = async (
    zipCode: string,
    onSuccess: (data: CepResult) => void,
    onError?: (message: string) => void
  ) => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsFetching(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        onError?.('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      onSuccess({
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      })
    } catch {
      onError?.('Erro ao buscar CEP. Preencha o endereço manualmente.')
    } finally {
      setIsFetching(false)
    }
  }

  return { lookup, isFetching }
}
