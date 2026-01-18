import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutCategory {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate between tickets' },
      { keys: ['Enter'], description: 'Select ticket' },
      { keys: ['Esc'], description: 'Close ticket details / dialogs' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Messages',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
      { keys: ['/'], description: 'Open quick responses' },
    ],
  },
  {
    title: 'Image Viewer',
    shortcuts: [
      { keys: ['←', '→'], description: 'Previous / Next image' },
      { keys: ['+', '-'], description: 'Zoom in / out' },
      { keys: ['R'], description: 'Rotate image' },
      { keys: ['Esc'], description: 'Close viewer' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Search tickets' },
      { keys: ['Ctrl', '/'], description: 'Focus message input' },
      { keys: ['Ctrl', 'N'], description: 'New ticket (widget)' },
    ],
  },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-text-muted">Quick actions to speed up your workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-surface-light transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUTS.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-medium text-text-secondary mb-3">
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-light/50 transition-colors"
                    >
                      <span className="text-sm text-white">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 text-xs font-mono bg-surface-light border border-border rounded text-text-secondary min-w-[24px] text-center">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-text-muted mx-1">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t border-border bg-surface-light/30">
          <p className="text-xs text-text-muted text-center">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-surface border border-border rounded mx-1">?</kbd> anytime to show this dialog
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook to manage keyboard shortcuts modal and global shortcuts
export function useKeyboardShortcuts() {
  return {
    // List of shortcuts for programmatic use
    shortcuts: SHORTCUTS,
  }
}
