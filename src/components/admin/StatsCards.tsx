import type { TicketStats } from '@/types/database'

interface StatsCardsProps {
  stats: TicketStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null

  const cards = [
    { label: 'Open', value: stats.open, color: 'text-cyan-400' },
    { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
    { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
    { label: 'Closed', value: stats.closed, color: 'text-slate-400' },
  ]

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-[#12121a] border-b border-white/10 animate-fade-in">
      <div className="flex gap-6">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="flex items-baseline gap-2 transition-all duration-200 hover:scale-105 cursor-default"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className={`text-2xl font-semibold ${card.color} tabular-nums`}>
              {card.value}
            </span>
            <span className="text-sm text-slate-500">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
