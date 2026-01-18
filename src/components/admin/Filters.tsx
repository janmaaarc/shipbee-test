import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'
import type { TicketStatus } from '@/types/database'

interface FiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: TicketStatus | 'all'
  onStatusChange: (status: TicketStatus | 'all') => void
}

const STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function Filters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: FiltersProps) {
  return (
    <div className="p-4 border-b border-white/10 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              statusFilter === tab.value
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
