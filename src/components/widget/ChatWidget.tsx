import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { WidgetButton } from './WidgetButton'
import { WidgetPanel } from './WidgetPanel'

export function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && user && (
        <WidgetPanel onClose={() => setIsOpen(false)} />
      )}
      <WidgetButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </div>
  )
}
