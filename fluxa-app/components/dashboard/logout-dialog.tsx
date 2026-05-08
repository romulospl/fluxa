'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)
    await logout()
    router.push('/')
  }

  function handleOpenChange(value: boolean) {
    if (isLoading) return
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isLoading}
        onInteractOutside={(e) => { if (isLoading) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (isLoading) e.preventDefault() }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Spinner className="size-10 text-primary" />
            <p className="text-sm text-muted-foreground">Encerrando sessão...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Sair do sistema</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o dashboard.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Sair
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
