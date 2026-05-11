'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useCharges } from '@/hooks/use-charges'
import { Charge, ChargeStatus, STATUS_CONFIG } from '@/lib/types'
import { ChargesTable } from '@/components/dashboard/charges-table'
import { NewChargeModal } from '@/components/dashboard/new-charge-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ChargesPage() {
  const { charges, addCharge } = useCharges()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | 'all'>('all')

  const filteredCharges = charges.filter(charge => {
    const matchesSearch = charge.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || charge.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleChargeCreated = (charge: Charge) => {
    addCharge(charge)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas cobranças
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cobrança
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ChargeStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charges Table */}
      <ChargesTable charges={filteredCharges} />

      {/* Empty State */}
      {filteredCharges.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-muted-foreground">Nenhuma cobrança encontrada</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
            className="mt-2"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* New Charge Modal */}
      <NewChargeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleChargeCreated}
      />
    </div>
  )
}
