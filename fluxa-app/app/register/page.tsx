'use client'

import { useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Loader2, Mail, User, Wallet, Building2, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { InputWithIcon } from '@/components/ui/input-with-icon'
import { LoadingButton } from '@/components/ui/loading-button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCNPJ, formatCEP } from '@/lib/formatters'
import { useCepLookup } from '@/hooks/use-cep-lookup'
import { useApiMutation } from '@/hooks/use-api-mutation'

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const calcDigit = (slice: string, weights: number[]) => {
    const sum = slice.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const d1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return d1 === parseInt(digits[12]) && d2 === parseInt(digits[13])
}

const STEPS = ['Dados da conta', 'Endereço da carteira', 'Endereço']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cnpjError, setCnpjError] = useState('')

  const [walletAddress, setWalletAddress] = useState('')

  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const [success, setSuccess] = useState(false)
  const { execute, isLoading, error, setError } = useApiMutation()
  const { lookup: lookupCep, isFetching: isFetchingCep } = useCepLookup()

  const handleCepBlur = () => {
    lookupCep(
      zipCode,
      (data) => {
        setStreet(data.street)
        setNeighborhood(data.neighborhood)
        setCity(data.city)
        setState(data.state)
      },
      (msg) => setError(msg)
    )
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateCNPJ(cnpj)) {
      setCnpjError('CNPJ inválido')
      return
    }
    setCnpjError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setStep(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(3)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    execute(async () => {
      const res = await api.post('/api/users', {
        name,
        email,
        password,
        walletAddress,
        cnpj: cnpj.replace(/\D/g, ''),
        address: { zipCode: zipCode.replace(/\D/g, ''), street, number, complement, neighborhood, city, state },
      })
      const data = res.data
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Fluxa</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Crie sua conta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a receber pagamentos em cripto hoje mesmo
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${step > i ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((label, i) => (
              <span key={i} className={step === i + 1 ? 'font-medium text-primary' : ''}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{STEPS[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && 'Preencha seus dados para se registrar'}
              {step === 2 && 'Informe o endereço da sua carteira de criptomoedas'}
              {step === 3 && 'Informe o endereço da sua empresa'}
            </CardDescription>
          </CardHeader>

          {step === 1 && (
            <form onSubmit={handleStep1}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <InputWithIcon icon={<User />} id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <InputWithIcon
                    icon={<Building2 />}
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    className={`font-mono ${cnpjError ? 'border-destructive' : ''}`}
                    value={cnpj}
                    onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjError('') }}
                    onBlur={() => { if (cnpj && !validateCNPJ(cnpj)) setCnpjError('CNPJ inválido') }}
                    required
                  />
                  {cnpjError && <p className="text-xs text-destructive">{cnpjError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <InputWithIcon icon={<Mail />} id="email" type="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button type="submit" className="w-full font-semibold">Próximo</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">Entrar</Link>
                </p>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Endereço da Carteira</Label>
                  <InputWithIcon
                    icon={<Wallet />}
                    id="walletAddress"
                    placeholder="Gx... ou endereço"
                    className="font-mono text-sm"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-6">
                <Button type="submit" className="w-full font-semibold">Próximo</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep(1); setError(null) }}>
                  Voltar
                </Button>
              </CardFooter>
            </form>
          )}

          {step === 3 && (
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
                    <InputWithIcon
                      id="zipCode"
                      icon={<MapPin />}
                      placeholder="00000-000"
                      className="font-mono"
                      value={zipCode}
                      onChange={(e) => setZipCode(formatCEP(e.target.value))}
                      onBlur={handleCepBlur}
                      required
                      disabled={isLoading || success}
                      rightElement={isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">UF</Label>
                    <Input id="state" placeholder="SP" className="text-center font-mono uppercase" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} required disabled={isLoading || success} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Logradouro</Label>
                  <Input id="street" placeholder="Rua, Avenida..." value={street} onChange={(e) => setStreet(e.target.value)} required disabled={isLoading || success} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} required disabled={isLoading || success} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" placeholder="Apto, Sala..." value={complement} onChange={(e) => setComplement(e.target.value)} disabled={isLoading || success} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" placeholder="Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required disabled={isLoading || success} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" placeholder="São Paulo" value={city} onChange={(e) => setCity(e.target.value)} required disabled={isLoading || success} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-6">
                <LoadingButton
                  type="submit"
                  className="w-full font-semibold"
                  loading={isLoading}
                  loadingText="Criando conta..."
                  disabled={success}
                >
                  Criar conta
                </LoadingButton>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep(2); setError(null) }}
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
