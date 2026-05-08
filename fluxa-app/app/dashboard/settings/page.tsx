'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Save, MapPin, Lock, Loader2, Pencil, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toastSuccess, toastError } from '@/lib/toast'

function formatCEP(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, '$1-$2')
}

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

type UserData = {
  id: string
  email: string
  name: string
  cnpj: string | null
  walletAddress: string | null
  address: {
    id: string
    zipCode: string
    street: string
    number: string
    complement: string | null
    neighborhood: string
    city: string
    state: string
  } | null
}

export default function SettingsPage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  // snapshot para restaurar ao cancelar edição
  const [snapshot, setSnapshot] = useState({
    name: '', email: '', zipCode: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '',
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/users/current')
        if (!res.ok) return
        const data: UserData = await res.json()
        setCnpj(data.cnpj ? formatCNPJ(data.cnpj) : '')
        const fields = {
          name: data.name ?? '',
          email: data.email ?? '',
          zipCode: data.address?.zipCode ? formatCEP(data.address.zipCode) : '',
          street: data.address?.street ?? '',
          number: data.address?.number ?? '',
          complement: data.address?.complement ?? '',
          neighborhood: data.address?.neighborhood ?? '',
          city: data.address?.city ?? '',
          state: data.address?.state ?? '',
        }
        setName(fields.name)
        setEmail(fields.email)
        setZipCode(fields.zipCode)
        setStreet(fields.street)
        setNumber(fields.number)
        setComplement(fields.complement)
        setNeighborhood(fields.neighborhood)
        setCity(fields.city)
        setState(fields.state)
        setSnapshot(fields)
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  const handleEdit = () => {
    setSnapshot({ name, email, zipCode, street, number, complement, neighborhood, city, state })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setName(snapshot.name)
    setEmail(snapshot.email)
    setZipCode(snapshot.zipCode)
    setStreet(snapshot.street)
    setNumber(snapshot.number)
    setComplement(snapshot.complement)
    setNeighborhood(snapshot.neighborhood)
    setCity(snapshot.city)
    setState(snapshot.state)
    setIsEditing(false)
  }

  const handleCepBlur = async () => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return
    setIsFetchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      }
    } catch {
      // silently fail — user fills manually
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setIsSavingProfile(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          address: { zipCode: zipCode.replace(/\D/g, ''), street, number, complement: complement || null, neighborhood, city, state },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setProfileError(data.error || 'Erro ao salvar dados.')
        return
      }
      setIsEditing(false)
      toastSuccess('Dados salvos com sucesso!')
    } catch {
      setProfileError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    setIsSavingPassword(true)
    try {
      const res = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordError(data.error || 'Erro ao alterar senha.')
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toastSuccess('Senha alterada com sucesso!')
    } catch {
      toastError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seus dados e segurança da conta</p>
      </div>

      {/* Dados pessoais + endereço */}
      <form onSubmit={handleSaveProfile}>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Atualize seu nome, e-mail e endereço</CardDescription>
            </div>
            {!isEditing && (
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  className="font-mono"
                  value={cnpj}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-4 text-sm font-medium text-card-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        placeholder="00000-000"
                        className="font-mono"
                        value={zipCode}
                        onChange={(e) => setZipCode(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        disabled={!isEditing}
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
                      disabled={!isEditing}
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
                    disabled={!isEditing}
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
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Apto, Sala..."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      disabled={!isEditing}
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
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="mt-4 space-y-2">
            {profileError && (
              <p className="text-sm text-destructive text-right">{profileError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={handleCancel} disabled={isSavingProfile}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Dados
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Segurança */}
      <form onSubmit={handleSavePassword}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" className="gap-2" disabled={isSavingPassword}>
            {isSavingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Alterar Senha
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
