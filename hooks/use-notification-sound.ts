"use client"

import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook for playing notification sounds with browser compatibility
 * Handles autoplay restrictions and provides fallback mechanisms
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const userInteractedRef = useRef(false)

  // Initialize audio on mount
  useEffect(() => {
    // Create audio element only in browser
    if (typeof window === 'undefined') return

    // Create base64-encoded notification sound (simple beep)
    // This is a simple 440Hz tone that works cross-browser
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const duration = 0.3
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const channel = buffer.getChannelData(0)

      // Generate a pleasant beep sound (440Hz with fade out)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const frequency = 440 // A4 note
        const amplitude = Math.max(0, 1 - t / duration) // Fade out
        channel[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.3
      }

      return buffer
    }

    try {
      // Try to use AudioContext for generated sound (most reliable)
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buffer = createNotificationSound()
      
      // Store buffer for later use
      audioRef.current = {
        play: () => {
          const source = context.createBufferSource()
          source.buffer = buffer
          source.connect(context.destination)
          source.start(0)
          return Promise.resolve()
        }
      } as any
      
      console.log('[v0] Notification sound initialized with AudioContext')
    } catch (error) {
      console.warn('[v0] AudioContext not available, will try HTML Audio API:', error)
      
      // Fallback to HTML Audio API with data URI
      // This is a simple notification beep as data URI
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Ik3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAF')
    }

    // Track user interaction to unlock autoplay
    const handleInteraction = () => {
      userInteractedRef.current = true
      console.log('[v0] User interaction detected, audio playback unlocked')
    }

    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      console.warn('[v0] Audio not initialized yet')
      return Promise.resolve()
    }

    console.log('[v0] Attempting to play notification sound...')
    
    try {
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        return playPromise
          .then(() => {
            console.log('[v0] Notification sound played successfully')
          })
          .catch((error) => {
            // Autoplay was prevented - this is expected on first load
            if (error.name === 'NotAllowedError') {
              console.log('[v0] Autoplay prevented - user interaction required first')
            } else {
              console.warn('[v0] Error playing notification sound:', error)
            }
          })
      }
      
      return Promise.resolve()
    } catch (error) {
      console.warn('[v0] Exception playing notification sound:', error)
      return Promise.resolve()
    }
  }, [])

  return { playSound, isReady: !!audioRef.current }
}
