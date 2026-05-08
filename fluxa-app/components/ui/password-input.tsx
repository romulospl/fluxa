'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string
}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        {...props}
        type={show ? 'text' : 'password'}
        className={`pl-10 pr-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
