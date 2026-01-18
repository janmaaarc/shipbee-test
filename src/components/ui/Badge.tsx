import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full capitalize',
        {
          'bg-white/10 text-text-secondary': variant === 'default',
          'bg-emerald-500/15 text-emerald-400': variant === 'success',
          'bg-amber-500/15 text-amber-400': variant === 'warning',
          'bg-red-500/15 text-red-400': variant === 'error',
          'bg-blue-500/15 text-blue-400': variant === 'info',
        },
        {
          'px-2 py-0.5 text-xs gap-1': size === 'sm',
          'px-2.5 py-1 text-sm gap-1.5': size === 'md',
        },
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            {
              'bg-white/50': variant === 'default',
              'bg-emerald-400': variant === 'success',
              'bg-amber-400': variant === 'warning',
              'bg-red-400': variant === 'error',
              'bg-blue-400': variant === 'info',
            }
          )}
        />
      )}
      {children}
    </span>
  )
}
