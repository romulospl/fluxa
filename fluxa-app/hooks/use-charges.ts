'use client'

import { useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import { Charge, ChargeStats } from '@/lib/types'

function mapCharge(c: {
  id: string
  number: number
  description: string
  amountBrl: number
  status: Charge['status']
  paymentMethod?: 'BOLETO' | 'PIX' | null
  paymentUrl?: string | null
  createdAt: string
  paidAt?: string | null
}): Charge {
  return {
    id: c.id,
    number: c.number,
    description: c.description,
    amountBRL: c.amountBrl,
    status: c.status,
    paymentMethod: c.paymentMethod ?? null,
    paymentUrl: c.paymentUrl ?? null,
    createdAt: new Date(c.createdAt),
    paidAt: c.paidAt ? new Date(c.paidAt) : undefined,
  }
}

const emptyStats: ChargeStats = {
  total: 0,
  totalBRL: 0,
  paidBRL: 0,
  pendingBRL: 0,
  pending: 0,
}

export function useCharges(limit = 10) {
  const [charges, setCharges] = useState<Charge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<ChargeStats>(emptyStats)

  const fetchPage = useCallback(async (pageNum: number) => {
    setIsLoading(true)
    try {
      const res = await api.get(`/api/charges?page=${pageNum}&limit=${limit}`, {
        withCredentials: true,
      })
      const data = res.data
      setCharges(data.data.map(mapCharge))
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setPage(pageNum)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/charges/stats', { withCredentials: true })
      const data: ChargeStats = res.data
      setStats(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
    fetchStats()
  }, [fetchPage, fetchStats])

  const addCharge = useCallback((charge: Charge) => {
    setCharges(prev => [charge, ...prev])
    setTotal(prev => prev + 1)
    fetchStats()
  }, [fetchStats])

  const updateChargeStatus = useCallback((id: string, status: Charge['status']) => {
    setCharges(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }, [])

  const getChargeById = useCallback((id: string) => {
    return charges.find(c => c.id === id)
  }, [charges])

  return {
    charges,
    isLoading,
    page,
    totalPages,
    total,
    goToPage: fetchPage,
    addCharge,
    updateChargeStatus,
    getChargeById,
    stats,
  }
}
