'use client'

import { useState } from 'react'
import { User, Mail, Bell, Shield, Save, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    name: 'João Silva',
    email: 'joao@exemplo.com',
  })
  const [notifications, setNotifications] = useState({
    email: true,
    payment: true,
    conversion: true,
    marketing: false,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e dados da conta
        </p>
      </div>

      {/* Profile */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <User className="h-5 w-5 text-primary" />
            Perfil
          </CardTitle>
          <CardDescription>
            Informações básicas da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como deseja receber alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-card-foreground">Notificações por E-mail</div>
              <div className="text-sm text-muted-foreground">Receba atualizações no seu e-mail</div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-card-foreground">Pagamentos Recebidos</div>
              <div className="text-sm text-muted-foreground">Alertas quando uma cobrança for paga</div>
            </div>
            <Switch
              checked={notifications.payment}
              onCheckedChange={(checked) => setNotifications({ ...notifications, payment: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-card-foreground">Conversões Finalizadas</div>
              <div className="text-sm text-muted-foreground">Alertas quando a conversão for concluída</div>
            </div>
            <Switch
              checked={notifications.conversion}
              onCheckedChange={(checked) => setNotifications({ ...notifications, conversion: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-card-foreground">E-mails de Marketing</div>
              <div className="text-sm text-muted-foreground">Novidades e ofertas especiais</div>
            </div>
            <Switch
              checked={notifications.marketing}
              onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Shield className="h-5 w-5 text-primary" />
            Segurança
          </CardTitle>
          <CardDescription>
            Proteja sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Alterar Senha</Button>
          <Button variant="outline">Configurar 2FA</Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
