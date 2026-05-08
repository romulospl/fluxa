'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap, Loader2, Mail, Lock, User, Wallet,
  Building2, MapPin, AlertCircle, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatCEP(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, '$1-$2')
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Etapa 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [cnpj, setCnpj] = useState('')

  // Etapa 2
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCepBlur = async () => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsFetchingCep(true)
    setError(null)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setError('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setStreet(data.logradouro || '')
      setNeighborhood(data.bairro || '')
      setCity(data.localidade || '')
      setState(data.uf || '')
    } catch {
      setError('Erro ao buscar CEP. Preencha o endereço manualmente.')
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          walletAddress,
          cnpj: cnpj.replace(/\D/g, ''),
          address: {
            zipCode: zipCode.replace(/\D/g, ''),
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
          },
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao realizar cadastro')

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Fluxa</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a receber pagamentos em cripto hoje mesmo
          </p>
        </div>

        {/* Indicador de etapas */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-primary transition-colors" />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={step === 1 ? 'font-medium text-primary' : ''}>Dados da conta</span>
            <span className={step === 2 ? 'font-medium text-primary' : ''}>Endereço</span>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {step === 1 ? 'Dados da conta' : 'Endereço'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Preencha seus dados para se registrar'
                : 'Informe o endereço da sua empresa'}
            </CardDescription>
          </CardHeader>

          {/* ── Etapa 1 ── */}
          {step === 1 && (
            <form onSubmit={handleNextStep}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      className="pl-10 font-mono"
                      value={cnpj}
                      onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Endereço da Carteira</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="walletAddress"
                      placeholder="Gx... ou endereço"
                      className="pl-10 font-mono text-sm"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button type="submit" className="w-full font-semibold">
                  Próximo
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Entrar
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}

          {/* ── Etapa 2 ── */}
          {step === 2 && (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-success/50 bg-success/10 text-success animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Cadastro realizado com sucesso! Redirecionando...</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="zipCode"
                        placeholder="00000-000"
                        className="pl-10 font-mono"
                        value={zipCode}
                        onChange={(e) => setZipCode(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        required
                        disabled={isLoading || success}
                      />
                      {isFetchingCep && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">UF</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      className="text-center font-mono uppercase"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      required
                      disabled={isLoading || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Logradouro</Label>
                  <Input
                    id="street"
                    placeholder="Rua, Avenida..."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      required
                      disabled={isLoading || success}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Apto, Sala..."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      disabled={isLoading || success}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Centro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      required
                      disabled={isLoading || success}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      disabled={isLoading || success}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-6">
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep(1); setError(null) }}
                  disabled={isLoading || success}
                >
                  Voltar
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
