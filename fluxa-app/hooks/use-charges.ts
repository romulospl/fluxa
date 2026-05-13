'use client'

import { useState, useCallback, useEffect } from 'react'
import { Charge } from '@/lib/types'

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

export function useCharges(limit = 10) {
  const [charges, setCharges] = useState<Charge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(async (pageNum: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/charges?page=${pageNum}&limit=${limit}`, {
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      setCharges(data.data.map(mapCharge))
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setPage(pageNum)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const addCharge = useCallback((charge: Charge) => {
    setCharges(prev => [charge, ...prev])
    setTotal(prev => prev + 1)
  }, [])

  const updateChargeStatus = useCallback((id: string, status: Charge['status']) => {
    setCharges(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }, [])

  const getChargeById = useCallback((id: string) => {
    return charges.find(c => c.id === id)
  }, [charges])

  const stats = {
    total,
    pending: charges.filter(c => c.status === 'pending').length,
    paid: charges.filter(c => c.status === 'paid').length,
    converting: charges.filter(c => c.status === 'converting').length,
    completed: charges.filter(c => c.status === 'completed').length,
    totalBRL: charges.reduce((acc, c) => acc + c.amountBRL, 0),
    completedBRL: charges.filter(c => c.status === 'completed').reduce((acc, c) => acc + c.amountBRL, 0),
  }

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
