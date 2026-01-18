import { useState, useMemo } from 'react'
import { Search, MessageSquare, ChevronRight, Zap } from 'lucide-react'
import { useCannedResponses } from '../../hooks/useCannedResponses'
import type { CannedResponse } from '../../types/database'

interface CannedResponsesPickerProps {
  onSelect: (content: string) => void
  onClose: () => void
  searchQuery?: string
}

export function CannedResponsesPicker({ onSelect, onClose, searchQuery = '' }: CannedResponsesPickerProps) {
  const { responses, categories, loading } = useCannedResponses()
  const [search, setSearch] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredResponses = useMemo(() => {
    let filtered = responses

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory)
    }

    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(lowerSearch) ||
        r.content.toLowerCase().includes(lowerSearch) ||
        r.shortcut?.toLowerCase().includes(lowerSearch)
      )
    }

    return filtered
  }, [responses, selectedCategory, search])

  function handleSelect(response: CannedResponse) {
    onSelect(response.content)
    onClose()
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-text-muted">
        Loading responses...
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden max-h-80 flex flex-col animate-in fade-in slide-in-from-bottom-2">
      {/* Search header */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses..."
            autoFocus
            className="w-full pl-9 pr-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-light text-text-secondary hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-light text-text-secondary hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Responses list */}
      <div className="flex-1 overflow-y-auto">
        {filteredResponses.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-sm">
            No responses found
          </div>
        ) : (
          <div className="p-1">
            {filteredResponses.map(response => (
              <button
                key={response.id}
                onClick={() => handleSelect(response)}
                className="w-full p-3 text-left rounded-lg hover:bg-surface-light transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-brand-500/10 rounded-lg flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {response.title}
                      </p>
                      {response.shortcut && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-light text-[10px] text-text-muted rounded font-mono">
                          <Zap className="w-2.5 h-2.5" />
                          {response.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
                      {response.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border bg-surface-light/50">
        <p className="text-[10px] text-text-muted">
          Tip: Type <span className="font-mono text-brand-400">/shortcut</span> in the message box to quickly insert
        </p>
      </div>
    </div>
  )
}
