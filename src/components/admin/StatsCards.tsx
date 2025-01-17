import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { TicketStats } from '@/types/database'

interface StatsCardsProps {
  stats: TicketStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null

  const cards = [
    {
      label: 'Open',
      value: stats.open,
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Closed',
      value: stats.closed,
      icon: XCircle,
      color: 'text-slate-600 bg-slate-100',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg p-4 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
