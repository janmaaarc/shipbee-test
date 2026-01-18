import { useState } from 'react'
import { WidgetButton } from './WidgetButton'
import { WidgetPanel } from './WidgetPanel'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] h-[min(600px,calc(100vh-7rem))] bg-background border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <WidgetPanel />
        </div>
      )}

      {/* Toggle button */}
      <WidgetButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </div>
  )
}
