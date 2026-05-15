import { describe, it, expect } from 'vitest'
import { easeOutQuart, computeAlpha, INTRO_DURATIONS } from '../intro-animation'

describe('easeOutQuart', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutQuart(0)).toBe(0)
  })
  it('returns 1 at t=1', () => {
    expect(easeOutQuart(1)).toBe(1)
  })
  it('is monotonic', () => {
    expect(easeOutQuart(0.5)).toBeGreaterThan(easeOutQuart(0.25))
    expect(easeOutQuart(0.75)).toBeGreaterThan(easeOutQuart(0.5))
  })
  it('decelerates (more progress early)', () => {
    expect(easeOutQuart(0.5)).toBeGreaterThan(0.5) // ease-out: past midpoint quickly
  })
})

describe('INTRO_DURATIONS', () => {
  it('cat 1.8s, wolf 1.2s, deer 2.0s', () => {
    expect(INTRO_DURATIONS.cat).toBe(1.8)
    expect(INTRO_DURATIONS.wolf).toBe(1.2)
    expect(INTRO_DURATIONS.deer).toBe(2.0)
  })
})

describe('computeAlpha', () => {
  const duration = 1.6
  const fadeStart = 0.3

  it('particle alpha is 0.15 before fade starts', () => {
    expect(computeAlpha({ elapsed: 0, duration, fadeStart, target: 'particle' })).toBeCloseTo(0.15)
    expect(computeAlpha({ elapsed: 0.2, duration, fadeStart, target: 'particle' })).toBeCloseTo(0.15)
  })
  it('particle alpha at end = 1', () => {
    expect(computeAlpha({ elapsed: duration, duration, fadeStart, target: 'particle' })).toBeCloseTo(1)
  })
  it('text alpha is 0 before fadeStart', () => {
    expect(computeAlpha({ elapsed: 0.2, duration, fadeStart, target: 'text' })).toBe(0)
  })
  it('text alpha at end = 1', () => {
    expect(computeAlpha({ elapsed: duration, duration, fadeStart, target: 'text' })).toBeCloseTo(1)
  })
})
