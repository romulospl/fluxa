'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { InputWithIcon } from '@/components/ui/input-with-icon'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string
}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <InputWithIcon
      {...props}
      type={show ? 'text' : 'password'}
      className={className}
      icon={<Lock />}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  )
}
