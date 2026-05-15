import { useEffect, useRef, useState } from 'react'
import type { Animal } from './types'

export const INTRO_DURATIONS: Record<Animal, number> = {
  cat: 1.8,
  wolf: 1.2,
  deer: 2.0,
}

/** σ (世界单位) for ink-wash fallback jitter */
export const INTRO_SIGMA = 0.6

/** Text fade lags particle motion by this many seconds */
export const INTRO_FADE_START = 0.3

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

interface ComputeAlphaInput {
  elapsed: number
  duration: number
  fadeStart: number
  target: 'particle' | 'text'
}

export function computeAlpha({ elapsed, duration, fadeStart, target }: ComputeAlphaInput): number {
  if (elapsed >= duration) return 1
  if (target === 'particle') {
    if (elapsed < fadeStart) return 0.15
    const u = (elapsed - fadeStart) / (duration - fadeStart)
    return 0.15 + (1 - 0.15) * easeOutQuart(u)
  } else {
    if (elapsed < fadeStart) return 0
    return (elapsed - fadeStart) / (duration - fadeStart)
  }
}

export interface IntroState {
  /** progress 0..1 — driving particle position lerp */
  particleProgress: number
  /** alpha 0.15..1 — shader uniform */
  particleAlpha: number
  /** alpha 0..1 — text opacity */
  textAlpha: number
  /** true once animation completed */
  done: boolean
}

interface UseIntroAnimationInput {
  animal: Animal
  /** when true (sub-page return, reduce-motion), skip animation */
  skip: boolean
}

/**
 * Drives intro animation timeline. Returns alpha values and progress on every animation frame.
 * Triggers once on mount unless skip=true.
 */
export function useIntroAnimation({ animal, skip }: UseIntroAnimationInput): IntroState {
  const duration = INTRO_DURATIONS[animal]
  const start = useRef<number | null>(null)
  const [state, setState] = useState<IntroState>(() =>
    skip
      ? { particleProgress: 1, particleAlpha: 1, textAlpha: 1, done: true }
      : { particleProgress: 0, particleAlpha: 0.15, textAlpha: 0, done: false }
  )

  useEffect(() => {
    if (skip) return
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const elapsed = (now - start.current) / 1000
      const u = Math.min(1, elapsed / duration)
      const particleProgress = easeOutQuart(u)
      const particleAlpha = computeAlpha({ elapsed, duration, fadeStart: INTRO_FADE_START, target: 'particle' })
      const textAlpha = computeAlpha({ elapsed, duration, fadeStart: INTRO_FADE_START, target: 'text' })
      const done = elapsed >= duration
      setState({ particleProgress, particleAlpha, textAlpha, done })
      if (!done) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animal, skip, duration])

  return state
}
