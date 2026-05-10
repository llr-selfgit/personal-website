import { describe, it, expect } from 'vitest'
import { detectTier } from '@/lib/device-tier'

describe('detectTier', () => {
  it('returns low when WebGL2 unavailable', () => {
    expect(detectTier({ hasWebGL2: false, deviceMemory: 16, hardwareConcurrency: 16, viewportWidth: 1920 })).toBe('low')
  })
  it('returns high for desktop-class', () => {
    expect(detectTier({ hasWebGL2: true, deviceMemory: 16, hardwareConcurrency: 12, viewportWidth: 1920 })).toBe('high')
  })
  it('returns mid for mid-range', () => {
    expect(detectTier({ hasWebGL2: true, deviceMemory: 6, hardwareConcurrency: 6, viewportWidth: 1024 })).toBe('mid')
  })
  it('returns low for phone-class', () => {
    expect(detectTier({ hasWebGL2: true, deviceMemory: 2, hardwareConcurrency: 4, viewportWidth: 390 })).toBe('low')
  })
  it('borderline: 8GB but small viewport → mid', () => {
    expect(detectTier({ hasWebGL2: true, deviceMemory: 8, hardwareConcurrency: 8, viewportWidth: 1024 })).toBe('mid')
  })
})
