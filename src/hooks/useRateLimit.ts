import { useState, useCallback, useRef, useEffect } from 'react'
import { createRateLimiter } from '../lib/utils'

interface UseRateLimitOptions {
  maxRequests: number
  windowMs: number
  onRateLimited?: () => void
}

interface UseRateLimitReturn {
  isRateLimited: boolean
  remainingRequests: number
  resetTime: number
  checkAndRecord: () => boolean
  canMakeRequest: () => boolean
}

export function useRateLimit({
  maxRequests,
  windowMs,
  onRateLimited,
}: UseRateLimitOptions): UseRateLimitReturn {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState(maxRequests)
  const [resetTime, setResetTime] = useState(0)

  const limiterRef = useRef(createRateLimiter(maxRequests, windowMs))

  // Update state periodically when rate limited
  useEffect(() => {
    if (!isRateLimited) return

    const interval = setInterval(() => {
      const remaining = limiterRef.current.getRemainingRequests()
      const reset = limiterRef.current.getResetTime()

      setRemainingRequests(remaining)
      setResetTime(reset)

      if (remaining > 0) {
        setIsRateLimited(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRateLimited])

  const canMakeRequest = useCallback(() => {
    return limiterRef.current.canMakeRequest()
  }, [])

  const checkAndRecord = useCallback(() => {
    if (!limiterRef.current.canMakeRequest()) {
      setIsRateLimited(true)
      setResetTime(limiterRef.current.getResetTime())
      onRateLimited?.()
      return false
    }

    limiterRef.current.recordRequest()
    setRemainingRequests(limiterRef.current.getRemainingRequests())
    return true
  }, [onRateLimited])

  return {
    isRateLimited,
    remainingRequests,
    resetTime,
    checkAndRecord,
    canMakeRequest,
  }
}

// Message rate limiter - 10 messages per minute
export function useMessageRateLimit(onRateLimited?: () => void) {
  return useRateLimit({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    onRateLimited,
  })
}
