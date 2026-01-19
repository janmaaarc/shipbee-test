import { useState } from 'react'
import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  // Show initials if no src, image failed to load, or explicitly errored
  if (!src || imgError) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium',
          'bg-gradient-to-br from-brand-400 to-brand-600 text-white',
          sizeClasses[size],
          className
        )}
      >
        {name ? getInitials(name) : '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'Avatar'}
      onError={() => setImgError(true)}
      className={cn(
        'rounded-full object-cover bg-surface-light',
        sizeClasses[size],
        className
      )}
    />
  )
}
