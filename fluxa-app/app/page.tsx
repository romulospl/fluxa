import Link from 'next/link'
import { Zap, ArrowRight, Shield, Wallet, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CryptoPrices } from '@/components/crypto-prices'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Fluxa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-4 w-4" />
            Conversão instantânea para cripto
          </div>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Receba em BRL, converta para cripto automaticamente
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Crie cobranças em Reais e receba o valor convertido diretamente na sua carteira digital. Simples, transparente e rastreável na blockchain.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Crypto Prices */}
      <CryptoPrices />

      {/* Features */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Como Funciona
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                1. Configure sua Carteira
              </h3>
              <p className="text-muted-foreground">
                Cadastre seu endereço de carteira digital para receber Bitcoin, Ethereum ou stablecoins.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                2. Crie Cobranças em BRL
              </h3>
              <p className="text-muted-foreground">
                Gere links de pagamento com Pix ou Boleto. Seus clientes pagam em Reais normalmente.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                3. Receba em Cripto
              </h3>
              <p className="text-muted-foreground">
                O valor é convertido automaticamente e enviado para sua carteira com hash verificável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16">
            <div className="flex-1">
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Segurança e Transparência
              </h2>
              <p className="mb-6 text-muted-foreground">
                Todas as transações são registradas na blockchain, garantindo total rastreabilidade. Você sempre tem acesso ao hash da transação e pode verificar no explorer.
              </p>
              <ul className="space-y-3">
                {/* <li className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Pagamentos processados via Asaas
                </li> */}
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Conversão com melhores taxas do mercado
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Transações verificáveis on-chain
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Transação Finalizada</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium text-card-foreground">R$ 5.000,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Convertido</span>
                    <span className="font-medium text-primary">0.00820000 BTC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TX Hash</span>
                    <span className="font-mono text-xs text-card-foreground">0x8f4e...2f1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Pronto para começar?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Crie sua conta em menos de 2 minutos e comece a receber pagamentos em cripto hoje.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Fluxa</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Fluxa. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
