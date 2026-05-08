import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
  rightElement?: React.ReactNode
}

export function InputWithIcon({ icon, rightElement, className, ...props }: InputWithIconProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground [&>svg]:size-4">
        {icon}
      </div>
      <Input
        className={cn('pl-10', rightElement && 'pr-10', className)}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-2.5">
          {rightElement}
        </div>
      )}
    </div>
  )
}
