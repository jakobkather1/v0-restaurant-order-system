"use client"

import { useCallback, useRef, useEffect, useState } from 'react'

/**
 * Hook for playing notification sounds with browser compatibility
 * Prioritizes /notification.mp3, falls back to 3-second synthetic tone
 * Handles autoplay restrictions with explicit unlock mechanism
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)

  // Initialize audio on mount
  useEffect(() => {
    // Create audio element only in browser
    if (typeof window === 'undefined') return

    // Create 3-second synthetic notification sound
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const duration = 3.0 // Extended to 3 seconds
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const channel = buffer.getChannelData(0)

      // Generate a pleasant alarm sound (440Hz with envelope)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const frequency = 440 // A4 note
        // Envelope: fade in first 0.1s, sustain, fade out last 0.5s
        let amplitude = 0.5
        if (t < 0.1) {
          amplitude = (t / 0.1) * 0.5
        } else if (t > duration - 0.5) {
          amplitude = ((duration - t) / 0.5) * 0.5
        }
        channel[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude
      }

      return buffer
    }

    try {
      // Initialize AudioContext
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = context
      
      // Try to load /notification.mp3 first
      const tryLoadMP3 = async () => {
        try {
          console.log('[v0] Attempting to load /notification.mp3...')
          const response = await fetch('/notification.mp3')
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const decodedBuffer = await context.decodeAudioData(arrayBuffer)
            audioBufferRef.current = decodedBuffer
            console.log('[v0] Notification sound loaded from /notification.mp3')
            return true
          }
        } catch (error) {
          console.log('[v0] /notification.mp3 not available, using synthetic sound')
        }
        return false
      }

      tryLoadMP3().then((loaded) => {
        if (!loaded) {
          // Fallback to synthetic sound
          audioBufferRef.current = createNotificationSound()
          console.log('[v0] Notification sound initialized with 3-second synthetic tone')
        }
      })

      // Also try HTML Audio as additional fallback
      audioRef.current = new Audio('/notification.mp3')
      audioRef.current.volume = 0.7
      audioRef.current.onerror = () => {
        console.log('[v0] HTML Audio fallback not available')
        audioRef.current = null
      }
      
    } catch (error) {
      console.warn('[v0] AudioContext initialization failed:', error)
    }
  }, [])

  // Explicit unlock function for user interaction
  const unlockAudio = useCallback(async () => {
    console.log('[v0] Unlocking audio...')
    
    if (audioContextRef.current) {
      // Resume AudioContext if suspended (critical for mobile devices)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('[v0] AudioContext resumed from suspended state')
      }
    }

    setUserInteracted(true)
    console.log('[v0] Audio unlocked - ready for playback')
    
    // Play a short test sound to fully unlock
    if (audioContextRef.current && audioBufferRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource()
        source.buffer = audioBufferRef.current
        const gainNode = audioContextRef.current.createGain()
        gainNode.gain.value = 0.1 // Very quiet test
        source.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        source.start(0)
        source.stop(audioContextRef.current.currentTime + 0.1)
      } catch (error) {
        console.log('[v0] Test sound failed:', error)
      }
    }
  }, [])

  const playSound = useCallback(async () => {
    console.log('[v0] playSound called, userInteracted:', userInteracted)
    
    // Resume AudioContext if needed (critical for mobile)
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
        console.log('[v0] AudioContext resumed before playback')
      } catch (error) {
        console.warn('[v0] Failed to resume AudioContext:', error)
      }
    }

    // Try AudioContext first (most reliable)
    if (audioContextRef.current && audioBufferRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource()
        source.buffer = audioBufferRef.current
        source.connect(audioContextRef.current.destination)
        source.start(0)
        console.log('[v0] Notification sound playing (AudioContext, 3 seconds)')
        return Promise.resolve()
      } catch (error) {
        console.warn('[v0] AudioContext playback failed:', error)
      }
    }

    // Fallback to HTML Audio
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        console.log('[v0] Notification sound playing (HTML Audio)')
        return Promise.resolve()
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          console.log('[v0] Autoplay prevented - user interaction required')
        } else {
          console.warn('[v0] HTML Audio playback failed:', error)
        }
      }
    }

    console.warn('[v0] All audio playback methods failed')
    return Promise.resolve()
  }, [userInteracted])

  return { 
    playSound, 
    unlockAudio,
    isReady: !!(audioContextRef.current && audioBufferRef.current),
    needsUnlock: !userInteracted
  }
}
