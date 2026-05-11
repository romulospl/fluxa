'use client'

import { useState, useCallback } from 'react'
import { Charge } from '@/lib/types'
import { mockCharges } from '@/lib/data'

export function useCharges() {
  const [charges, setCharges] = useState<Charge[]>(mockCharges)
  const [isLoading, setIsLoading] = useState(false)

  const addCharge = useCallback((charge: Charge) => {
    setCharges(prev => [charge, ...prev])
  }, [])

  const updateChargeStatus = useCallback((id: string, status: Charge['status']) => {
    setCharges(prev => prev.map(charge => 
      charge.id === id ? { ...charge, status } : charge
    ))
  }, [])

  const getChargeById = useCallback((id: string) => {
    return charges.find(charge => charge.id === id)
  }, [charges])

  const stats = {
    total: charges.length,
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
    addCharge,
    updateChargeStatus,
    getChargeById,
    stats,
  }
}
