'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Loader2 } from 'lucide-react'
import { useCharges } from '@/hooks/use-charges'
import { ChargeStatus, STATUS_CONFIG } from '@/lib/types'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

const PAGE_LIMIT = 10

export default function ChargesPage() {
  const { charges, isLoading, page, totalPages, goToPage } = useCharges(PAGE_LIMIT)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | 'all'>('all')

  const filteredCharges = charges.filter(charge => {
    const matchesSearch = charge.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || charge.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
          <p className="text-muted-foreground">Gerencie todas as suas cobranças</p>
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
      {isLoading && charges.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <ChargesTable charges={filteredCharges} onRefresh={() => goToPage(page)} isRefreshing={isLoading} />

          {filteredCharges.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <p className="text-muted-foreground">Nenhuma cobrança encontrada</p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (page > 1) goToPage(page - 1) }}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {pageNumbers.map((p, i) =>
              p === null ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => { e.preventDefault(); goToPage(p) }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages) goToPage(page + 1) }}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* New Charge Modal */}
      <NewChargeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { goToPage(1); setIsModalOpen(false) }}
      />
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | null)[] = [1]

  if (current > 3) pages.push(null)

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push(null)

  pages.push(total)
  return pages
}
