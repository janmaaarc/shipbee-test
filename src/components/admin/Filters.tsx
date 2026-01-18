import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { TicketStatus, TicketPriority } from '../../types/database'

interface FiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: TicketStatus[]
  onStatusChange: (statuses: TicketStatus[]) => void
  priorityFilter: TicketPriority[]
  onPriorityChange: (priorities: TicketPriority[]) => void
}

const STATUSES: { value: TicketStatus; label: string; color: string; bg: string; activeBg: string; border: string }[] = [
  { value: 'open', label: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  { value: 'pending', label: 'Pending', color: 'text-blue-400', bg: 'bg-blue-500/10', activeBg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { value: 'resolved', label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { value: 'closed', label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/10', activeBg: 'bg-gray-500/20', border: 'border-gray-500/30' },
]

const PRIORITIES: { value: TicketPriority; label: string; color: string; bg: string; activeBg: string; border: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20', border: 'border-red-500/30' },
  { value: 'high', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', activeBg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', activeBg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { value: 'low', label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/10', activeBg: 'bg-slate-500/20', border: 'border-slate-500/30' },
]

export const Filters = forwardRef<HTMLInputElement, FiltersProps>(function Filters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
}, ref) {
  function toggleStatus(status: TicketStatus) {
    if (statusFilter.includes(status)) {
      onStatusChange(statusFilter.filter((s) => s !== status))
    } else {
      onStatusChange([...statusFilter, status])
    }
  }

  function togglePriority(priority: TicketPriority) {
    if (priorityFilter.includes(priority)) {
      onPriorityChange(priorityFilter.filter((p) => p !== priority))
    } else {
      onPriorityChange([...priorityFilter, priority])
    }
  }

  function clearFilters() {
    onSearchChange('')
    onStatusChange([])
    onPriorityChange([])
  }

  const hasFilters = searchTerm || statusFilter.length > 0 || priorityFilter.length > 0
  const activeFilterCount = statusFilter.length + priorityFilter.length

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          ref={ref}
          type="text"
          placeholder="Search tickets... (⌘K)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tickets"
          className="w-full pl-9 pr-8 py-2 bg-surface-light border border-border rounded-lg text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-white transition-colors rounded"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((status) => {
            const isSelected = statusFilter.includes(status.value)
            return (
              <button
                key={status.value}
                onClick={() => toggleStatus(status.value)}
                aria-pressed={isSelected}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150',
                  isSelected
                    ? cn(status.activeBg, status.border, status.color)
                    : 'bg-surface-light border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isSelected ? status.color.replace('text-', 'bg-') : 'bg-current opacity-40'
                )} />
                {status.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority filters */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Priority</p>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((priority) => {
            const isSelected = priorityFilter.includes(priority.value)
            return (
              <button
                key={priority.value}
                onClick={() => togglePriority(priority.value)}
                aria-pressed={isSelected}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150',
                  isSelected
                    ? cn(priority.activeBg, priority.border, priority.color)
                    : 'bg-surface-light border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isSelected ? priority.color.replace('text-', 'bg-') : 'bg-current opacity-40'
                )} />
                {priority.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
          Clear filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      )}
    </div>
  )
})
