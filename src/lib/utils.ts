import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TicketStatus, TicketPriority } from '../types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Secure unique ID generation
export function generateId(): string {
  return crypto.randomUUID()
}

// Debounce function for search inputs
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Status configuration
export const statusConfig = {
  open: {
    label: 'Open',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400'
  },
  pending: {
    label: 'Pending',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400'
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    dot: 'bg-gray-400'
  },
} as const

export function getStatusConfig(status: TicketStatus) {
  return statusConfig[status]
}

// Priority configuration
export const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30'
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30'
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30'
  },
} as const

export function getPriorityConfig(priority: TicketPriority) {
  return priorityConfig[priority]
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Text validation
export function validateText(text: string, minLength = 1, maxLength = 1000): string | null {
  const trimmed = text.trim()
  if (trimmed.length < minLength) {
    return `Must be at least ${minLength} character${minLength > 1 ? 's' : ''}`
  }
  if (trimmed.length > maxLength) {
    return `Must be less than ${maxLength} characters`
  }
  return null
}

// ============================================
// XSS Protection & Input Sanitization
// ============================================

// HTML entity map for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

// Escape HTML to prevent XSS
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

// Sanitize user input - removes potentially dangerous content
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Trim excessive whitespace while preserving single spaces and newlines
  sanitized = sanitized.replace(/[ \t]+/g, ' ')
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')

  return sanitized.trim()
}

// Sanitize message content for display (escapes HTML but preserves newlines)
export function sanitizeMessageContent(content: string): string {
  const sanitized = sanitizeInput(content)
  return escapeHtml(sanitized)
}

// URL validation and sanitization
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Sanitize URL - only allow http/https
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    return parsed.href
  } catch {
    return null
  }
}

// Validate and sanitize file name
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '')

  // Remove directory separators
  sanitized = sanitized.replace(/[/\\]/g, '')

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'))
    const name = sanitized.slice(0, 255 - ext.length)
    sanitized = name + ext
  }

  return sanitized || 'unnamed'
}

// Check for potentially malicious file types
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.js', '.jse', '.vbs', '.vbe', '.ws', '.wsf', '.wsc',
  '.ps1', '.psm1', '.psd1', '.sh', '.bash', '.csh', '.ksh',
  '.hta', '.jar', '.reg', '.inf', '.dll', '.sys',
]

export function isFileTypeSafe(fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  return !DANGEROUS_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

// Rate limiting helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests: number[] = []

  return {
    canMakeRequest(): boolean {
      const now = Date.now()
      // Remove old requests outside the window
      while (requests.length > 0 && requests[0] < now - windowMs) {
        requests.shift()
      }
      return requests.length < maxRequests
    },
    recordRequest(): void {
      requests.push(Date.now())
    },
    getRemainingRequests(): number {
      const now = Date.now()
      while (requests.length > 0 && requests[0] < now - windowMs) {
        requests.shift()
      }
      return Math.max(0, maxRequests - requests.length)
    },
    getResetTime(): number {
      if (requests.length === 0) return 0
      return Math.max(0, requests[0] + windowMs - Date.now())
    },
  }
}

// Linkify text - convert URLs to clickable links (safely)
export function linkifyText(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g
  return escapeHtml(text).replace(urlRegex, (url) => {
    const safeUrl = sanitizeUrl(url)
    if (!safeUrl) return url
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">${url}</a>`
  })
}
