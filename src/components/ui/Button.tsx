import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.97]',
          {
            'bg-white text-[#0a0a0f] hover:bg-gray-100 focus:ring-white/80': variant === 'primary',
            'bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/30 focus:ring-white/50': variant === 'secondary',
            'bg-transparent text-text-secondary hover:text-white hover:bg-white/5 focus:ring-white/30': variant === 'ghost',
            'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500/50': variant === 'danger',
            'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 focus:ring-emerald-500/50': variant === 'success',
          },
          {
            'px-3 py-1.5 text-sm rounded-lg gap-1.5': size === 'sm',
            'px-4 py-2 text-sm rounded-lg gap-2': size === 'md',
            'px-6 py-3 text-base rounded-xl gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
