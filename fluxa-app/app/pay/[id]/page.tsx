'use client'

import { useState } from 'react'
import { Copy, Check, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/data'

// Mock charge data - in real app this would come from URL params and API
const mockCharge = {
  id: 'abc123',
  description: 'Consultoria de Software',
  amountBRL: 5000,
  createdBy: 'João Silva',
  createdAt: new Date('2024-01-22'),
  dueDate: new Date('2024-01-29'),
}

const mockPixData = {
  key: '00020126580014br.gov.bcb.pix0136abc123-def456-ghi789-jkl012-mno345pqr67852040000530398654045000.005802BR5913Fluxa Pagamentos6008Sao Paulo62070503***6304ABCD',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix',
}

export default function PaymentPage() {
  const [copied, setCopied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto'>('pix')

  const copyPixKey = async () => {
    await navigator.clipboard.writeText(mockPixData.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-foreground">Fluxa</span>
      </div>

      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-card-foreground">Pagamento</CardTitle>
          <CardDescription>
            Cobrança de {mockCharge.createdBy}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount */}
          <div className="rounded-lg bg-secondary/50 p-4 text-center">
            <div className="text-sm text-muted-foreground">Valor a pagar</div>
            <div className="text-3xl font-bold text-primary">
              {formatBRL(mockCharge.amountBRL)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {mockCharge.description}
            </div>
          </div>

          {/* Payment Method Toggle */}
          <div className="flex gap-2">
            <Button
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setPaymentMethod('pix')}
            >
              Pix
            </Button>
            <Button
              variant={paymentMethod === 'boleto' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setPaymentMethod('boleto')}
            >
              Boleto
            </Button>
          </div>

          {/* Pix Payment */}
          {paymentMethod === 'pix' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mockPixData.qrCodeUrl}
                    alt="QR Code Pix"
                    className="h-48 w-48"
                  />
                </div>
              </div>

              {/* Pix Copy */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-card-foreground">
                  Ou copie o código Pix:
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 truncate rounded-lg bg-secondary/50 p-3 font-mono text-xs text-muted-foreground">
                    {mockPixData.key.slice(0, 40)}...
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPixKey}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 text-sm font-medium text-card-foreground">
                  Como pagar:
                </div>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha pagar com Pix</li>
                  <li>3. Escaneie o QR code ou cole o código</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>
            </div>
          )}

          {/* Boleto Payment */}
          {paymentMethod === 'boleto' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  O boleto será gerado e enviado para o e-mail do pagador
                </div>
              </div>
              <Button className="w-full">
                Gerar Boleto
              </Button>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Aguardando pagamento
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        Pagamento processado com segurança via Asaas
      </div>
    </div>
  )
}
