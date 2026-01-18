import { useCallback, useRef, useEffect, useState } from 'react'

type SoundType = 'newMessage' | 'newTicket' | 'mention' | 'success' | 'error'

interface SoundConfig {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
}

// Sound configurations using Web Audio API (no external files needed)
const SOUNDS: Record<SoundType, SoundConfig[]> = {
  newMessage: [
    { frequency: 880, duration: 100, type: 'sine', volume: 0.3 },
    { frequency: 1100, duration: 100, type: 'sine', volume: 0.3 },
  ],
  newTicket: [
    { frequency: 660, duration: 100, type: 'sine', volume: 0.3 },
    { frequency: 880, duration: 100, type: 'sine', volume: 0.3 },
    { frequency: 1100, duration: 150, type: 'sine', volume: 0.3 },
  ],
  mention: [
    { frequency: 1200, duration: 80, type: 'sine', volume: 0.4 },
    { frequency: 1200, duration: 80, type: 'sine', volume: 0.4 },
  ],
  success: [
    { frequency: 523, duration: 100, type: 'sine', volume: 0.3 },
    { frequency: 659, duration: 100, type: 'sine', volume: 0.3 },
    { frequency: 784, duration: 150, type: 'sine', volume: 0.3 },
  ],
  error: [
    { frequency: 200, duration: 200, type: 'square', volume: 0.2 },
    { frequency: 150, duration: 200, type: 'square', volume: 0.2 },
  ],
}

const STORAGE_KEY = 'sound_notifications_enabled'

export function useSoundNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== 'false' // Default to enabled
  })

  // Initialize audio context on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  }, [enabled])

  // Play a sequence of tones
  const playTones = useCallback(async (tones: SoundConfig[]) => {
    const ctx = initAudioContext()

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    let startTime = ctx.currentTime

    for (const tone of tones) {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = tone.type
      oscillator.frequency.value = tone.frequency

      // Envelope for smoother sound
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(tone.volume, startTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, startTime + tone.duration / 1000)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(startTime)
      oscillator.stop(startTime + tone.duration / 1000)

      startTime += tone.duration / 1000
    }
  }, [initAudioContext])

  // Play a specific sound type
  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return

    const tones = SOUNDS[type]
    if (tones) {
      playTones(tones).catch(() => {
        // Silently fail if audio context is blocked
      })
    }
  }, [enabled, playTones])

  // Toggle sound notifications
  const toggle = useCallback(() => {
    setEnabled((prev) => !prev)
  }, [])

  return {
    enabled,
    setEnabled,
    toggle,
    playSound,
    playNewMessage: () => playSound('newMessage'),
    playNewTicket: () => playSound('newTicket'),
    playMention: () => playSound('mention'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
  }
}
