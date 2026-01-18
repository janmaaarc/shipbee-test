import { MessageCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface WidgetButtonProps {
  isOpen: boolean
  onClick: () => void
  unreadCount?: number
}

export function WidgetButton({ isOpen, onClick, unreadCount = 0 }: WidgetButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      aria-expanded={isOpen}
      className={cn(
        'relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-background',
        'active:scale-95',
        isOpen
          ? 'bg-surface-light text-white hover:bg-surface-light/80 shadow-black/20'
          : 'bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-white shadow-amber-500/25 hover:scale-105'
      )}
    >
      <div className={cn(
        'transition-transform duration-200',
        isOpen ? 'rotate-0' : ''
      )}>
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </div>
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
