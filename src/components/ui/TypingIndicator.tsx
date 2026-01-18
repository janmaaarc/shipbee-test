import { cn } from '../../lib/utils'

interface TypingIndicatorProps {
  name?: string
  className?: string
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      {name && (
        <span className="text-xs text-text-muted">{name} is typing...</span>
      )}
    </div>
  )
}
