'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateWalletAddress } from '@/lib/data'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    walletAddress: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.walletAddress.trim()) {
      newErrors.walletAddress = 'Endereço de carteira é obrigatório'
    } else if (!validateWalletAddress(formData.walletAddress)) {
      newErrors.walletAddress = 'Endereço de carteira inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">Fluxa</span>
      </div>

      <Card className="w-full max-w-md border-border bg-card">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-card-foreground">Crie sua Conta</CardTitle>
              <CardDescription>
                Preencha seus dados para começar a receber em cripto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setErrors({ ...errors, name: '' })
                  }}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setErrors({ ...errors, email: '' })
                  }}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>
              <Button onClick={handleNext} className="w-full gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-card-foreground">Configure sua Carteira</CardTitle>
              <CardDescription>
                Informe o endereço onde deseja receber seus ativos digitais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet">Endereço da Carteira</Label>
                <Input
                  id="wallet"
                  placeholder="0x..."
                  value={formData.walletAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, walletAddress: e.target.value })
                    setErrors({ ...errors, walletAddress: '' })
                  }}
                  className="font-mono"
                />
                {errors.walletAddress && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.walletAddress}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Aceitamos endereços Ethereum (0x...) e Bitcoin (1..., 3..., bc1...)
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-card-foreground">Tudo Pronto!</CardTitle>
              <CardDescription>
                Sua conta foi configurada com sucesso. Você já pode começar a criar cobranças.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleComplete} className="w-full">
                Acessar Dashboard
              </Button>
            </CardContent>
          </>
        )}
      </Card>

      {/* Progress Indicator */}
      <div className="mt-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
