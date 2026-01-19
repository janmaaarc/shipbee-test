import { useEffect, useRef } from 'react'
import { User, Shield } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import type { MentionableUser } from '../../hooks/useMentionableUsers'

interface MentionPickerProps {
  users: MentionableUser[]
  onSelect: (user: MentionableUser) => void
  onClose: () => void
  selectedIndex: number
  loading?: boolean
}

export function MentionPicker({ users, onSelect, onClose: _onClose, selectedIndex, loading }: MentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden p-3">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full" />
          Loading users...
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden p-3">
        <p className="text-sm text-text-muted">No users found</p>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
      role="listbox"
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user)}
          role="option"
          aria-selected={index === selectedIndex}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-brand-500/20 text-white'
              : 'hover:bg-surface-light text-text-secondary hover:text-white'
          }`}
        >
          <Avatar
            src={user.avatar_url}
            name={user.name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{user.name}</span>
              {user.role === 'admin' ? (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded">
                  <Shield className="w-3 h-3" />
                  Support
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                  <User className="w-3 h-3" />
                  Customer
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
