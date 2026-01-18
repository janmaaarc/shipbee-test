import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  showOptions?: boolean
}

export function ThemeToggle({ className = '', showLabel = false, showOptions = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  // Simple toggle between dark and light
  if (!showOptions) {
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
          resolvedTheme === 'dark'
            ? 'text-text-secondary hover:text-white hover:bg-white/5'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        } ${className}`}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
        {showLabel && (
          <span className="text-sm">{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
        )}
      </button>
    )
  }

  // Full options selector
  return (
    <div className={`flex items-center gap-1 p-1 bg-surface-light rounded-lg ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
          theme === 'light'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-text-secondary hover:text-white'
        }`}
        aria-pressed={theme === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
        {showLabel && <span>Light</span>}
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
          theme === 'dark'
            ? 'bg-surface text-white shadow-sm'
            : 'text-text-secondary hover:text-white'
        }`}
        aria-pressed={theme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabel && <span>Dark</span>}
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
          theme === 'system'
            ? 'bg-brand-500/20 text-brand-400 shadow-sm'
            : 'text-text-secondary hover:text-white'
        }`}
        aria-pressed={theme === 'system'}
      >
        <Monitor className="w-3.5 h-3.5" />
        {showLabel && <span>System</span>}
      </button>
    </div>
  )
}
