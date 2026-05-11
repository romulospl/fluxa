'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCharges } from '@/hooks/use-charges'
import { Charge } from '@/lib/types'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ChargesTable } from '@/components/dashboard/charges-table'
import { QuotesCard } from '@/components/dashboard/quotes-card'
import { NewChargeModal } from '@/components/dashboard/new-charge-modal'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { charges, stats, addCharge } = useCharges()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleChargeCreated = (charge: Charge) => {
    addCharge(charge)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground">
            Acompanhe suas cobranças e conversões em tempo real
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cobrança
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChargesTable charges={charges} />
        </div>
        <div>
          <QuotesCard />
        </div>
      </div>

      {/* New Charge Modal */}
      <NewChargeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleChargeCreated}
      />
    </div>
  )
}
