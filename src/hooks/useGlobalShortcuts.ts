import { useEffect, useCallback, useState } from 'react'

interface GlobalShortcutsOptions {
  onSearch?: () => void
  onFocusInput?: () => void
  onShowHelp?: () => void
  enabled?: boolean
}

export function useGlobalShortcuts({
  onSearch,
  onFocusInput,
  onShowHelp,
  enabled = true,
}: GlobalShortcutsOptions) {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs (except for specific ones)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Show help modal with ? key (works everywhere)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isInput) {
          e.preventDefault()
          setShowShortcutsModal(true)
          onShowHelp?.()
        }
      }

      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onSearch?.()
      }

      // Ctrl/Cmd + / to focus message input
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        onFocusInput?.()
      }

      // Escape to close shortcuts modal
      if (e.key === 'Escape' && showShortcutsModal) {
        setShowShortcutsModal(false)
      }
    },
    [enabled, onSearch, onFocusInput, onShowHelp, showShortcutsModal]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    showShortcutsModal,
    setShowShortcutsModal,
    openShortcutsModal: () => setShowShortcutsModal(true),
    closeShortcutsModal: () => setShowShortcutsModal(false),
  }
}
