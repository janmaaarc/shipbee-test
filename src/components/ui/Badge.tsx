import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    open: 'info',
    pending: 'warning',
    resolved: 'success',
    closed: 'default',
  }

  const labels: Record<string, string> = {
    open: 'Open',
    pending: 'Pending',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  return (
    <Badge variant={variants[status] || 'default'}>
      {labels[status] || status}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, BadgeVariant> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
  }

  return (
    <Badge variant={variants[priority] || 'default'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}
