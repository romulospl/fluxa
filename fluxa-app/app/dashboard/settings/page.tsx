'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Save, MapPin, Loader2, Pencil, X } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toastSuccess, toastError } from '@/lib/toast'
import { formatCEP, formatCNPJ } from '@/lib/formatters'
import { useCepLookup } from '@/hooks/use-cep-lookup'
import { useApiMutation } from '@/hooks/use-api-mutation'

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

  const [snapshot, setSnapshot] = useState({
    name: '', email: '', zipCode: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '',
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const {
    execute: saveProfile,
    isLoading: isSavingProfile,
    error: profileError,
  } = useApiMutation()

  const {
    execute: savePassword,
    isLoading: isSavingPassword,
    error: passwordError,
    setError: setPasswordError,
  } = useApiMutation()

  const { lookup: lookupCep, isFetching: isFetchingCep } = useCepLookup()

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

  const handleCepBlur = () => {
    lookupCep(zipCode, (data) => {
      setStreet(data.street)
      setNeighborhood(data.neighborhood)
      setCity(data.city)
      setState(data.state)
    })
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    saveProfile(async () => {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          address: { zipCode: zipCode.replace(/\D/g, ''), street, number, complement: complement || null, neighborhood, city, state },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados.')
      setIsEditing(false)
      toastSuccess('Dados salvos com sucesso!')
    })
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    savePassword(async () => {
      const res = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toastSuccess('Senha alterada com sucesso!')
    })
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
                <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0000-00" className="font-mono" value={cnpj} disabled readOnly />
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
                    <Input id="state" placeholder="SP" className="text-center font-mono uppercase" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} disabled={!isEditing} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Logradouro</Label>
                  <Input id="street" placeholder="Rua, Avenida..." value={street} onChange={(e) => setStreet(e.target.value)} disabled={!isEditing} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" placeholder="Apto, Sala..." value={complement} onChange={(e) => setComplement(e.target.value)} disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" placeholder="Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" placeholder="São Paulo" value={city} onChange={(e) => setCity(e.target.value)} disabled={!isEditing} />
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
              <LoadingButton type="submit" className="gap-2" loading={isSavingProfile} loadingText="Salvando...">
                <Save className="h-4 w-4" />
                Salvar Dados
              </LoadingButton>
            </div>
          </div>
        )}
      </form>

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
              <PasswordInput id="currentPassword" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <PasswordInput id="newPassword" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <PasswordInput id="confirmPassword" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <LoadingButton type="submit" className="gap-2" loading={isSavingPassword} loadingText="Salvando...">
            <Save className="h-4 w-4" />
            Alterar Senha
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}
