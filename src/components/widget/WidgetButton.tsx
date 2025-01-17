import { MessageCircle, X } from 'lucide-react'

interface WidgetButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function WidgetButton({ isOpen, onClick }: WidgetButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <MessageCircle className="w-6 h-6" />
      )}
    </button>
  )
}
