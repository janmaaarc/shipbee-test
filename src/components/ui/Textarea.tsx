import { forwardRef, useEffect, useRef, useImperativeHandle, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  autoExpand?: boolean
  minRows?: number
  maxRows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, autoExpand = false, minRows = 2, maxRows = 10, onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    const adjustHeight = () => {
      const textarea = textareaRef.current
      if (!textarea || !autoExpand) return

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'

      // Calculate line height (approximate)
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
      const paddingY = parseInt(getComputedStyle(textarea).paddingTop) + parseInt(getComputedStyle(textarea).paddingBottom)

      const minHeight = lineHeight * minRows + paddingY
      const maxHeight = lineHeight * maxRows + paddingY

      // Set the height to scrollHeight, clamped between min and max
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }

    useEffect(() => {
      adjustHeight()
    }, [props.value, autoExpand])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={id}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg',
            'text-white placeholder:text-text-muted',
            'transition-all duration-150',
            autoExpand ? 'resize-none overflow-hidden' : 'resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
