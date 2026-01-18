import { Volume2, VolumeX } from 'lucide-react'
import { useSoundNotifications } from '../../hooks/useSoundNotifications'

interface SoundToggleProps {
  className?: string
  showLabel?: boolean
}

export function SoundToggle({ className = '', showLabel = false }: SoundToggleProps) {
  const { enabled, toggle, playSuccess } = useSoundNotifications()

  function handleToggle() {
    toggle()
    // Play a test sound when enabling
    if (!enabled) {
      setTimeout(() => playSuccess(), 100)
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        enabled
          ? 'text-brand-400 hover:bg-brand-500/10'
          : 'text-text-muted hover:text-white hover:bg-white/5'
      } ${className}`}
      aria-label={enabled ? 'Disable sound notifications' : 'Enable sound notifications'}
      title={enabled ? 'Sound notifications on' : 'Sound notifications off'}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="text-sm">{enabled ? 'Sound On' : 'Sound Off'}</span>
      )}
    </button>
  )
}
