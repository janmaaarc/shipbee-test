import { MessageCircle, X } from 'lucide-react'

interface WidgetButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function WidgetButton({ isOpen, onClick }: WidgetButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/25 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 btn-press"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </span>
    </button>
  )
}
