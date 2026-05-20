'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Zap, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { InputWithIcon } from '@/components/ui/input-with-icon'
import { LoadingButton } from '@/components/ui/loading-button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useApiMutation } from '@/hooks/use-api-mutation'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { execute, isLoading, error } = useApiMutation()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    execute(async () => {
      const res = await api.post('/api/login', { email, password })
      const data = res.data
      if (data.token && data.user) setAuth(data.user, data.token)
      router.push('/dashboard')
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Fluxa</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para gerenciar suas cobranças
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Login</CardTitle>
            <CardDescription>Use suas credenciais para acessar o painel</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <InputWithIcon
                  icon={<Mail />}
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <LoadingButton
                type="submit"
                className="w-full font-semibold"
                loading={isLoading}
                loadingText="Entrando..."
              >
                Entrar
              </LoadingButton>
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
