import { Ticket, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { useAdminStats } from '../../hooks/useAdminStats'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../../lib/utils'

export function StatsCards() {
  const { stats, loading } = useAdminStats()

  const cards = [
    {
      label: 'Total Tickets',
      value: stats?.total_tickets ?? 0,
      icon: Ticket,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-white',
      glow: '',
    },
    {
      label: 'Open',
      value: stats?.open_tickets ?? 0,
      icon: AlertCircle,
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-400',
      glow: 'shadow-amber-500/5',
      highlight: true,
    },
    {
      label: 'Pending',
      value: stats?.pending_tickets ?? 0,
      icon: Clock,
      gradient: 'from-violet-500/20 to-violet-600/5',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      valueColor: 'text-white',
      glow: '',
    },
    {
      label: 'Resolved Today',
      value: stats?.resolved_today ?? 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-white',
      glow: '',
      showTrend: true,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-3"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-10" />
            </div>
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            'relative overflow-hidden rounded-xl p-3 transition-all duration-200',
            'bg-gradient-to-br border',
            card.gradient,
            card.highlight
              ? 'border-amber-500/30 shadow-lg'
              : 'border-white/5 hover:border-white/10',
            card.glow
          )}
        >
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className={cn('p-2 rounded-lg', card.iconBg)}>
              <card.icon className={cn('w-4 h-4', card.iconColor)} />
            </div>
            <div className="text-right">
              <p className={cn(
                'text-2xl font-bold tracking-tight',
                card.valueColor
              )}>
                {card.value}
              </p>
            </div>
          </div>

          <div className="relative mt-2 flex items-center justify-between">
            <p className="text-xs text-text-secondary font-medium">{card.label}</p>
            {card.showTrend && card.value > 0 && (
              <div className="flex items-center gap-0.5 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-medium">+{card.value}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
