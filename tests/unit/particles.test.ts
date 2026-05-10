import { describe, it, expect } from 'vitest'
import { samplePositionsFromAlpha, normalizeToRange, PARTICLE_COUNTS } from '@/lib/particles'

function makeImageData(w: number, h: number, alphaFill: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < data.length; i += 4) data[i + 3] = alphaFill
  return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData
}

describe('samplePositionsFromAlpha', () => {
  it('samples ~N positions from fully opaque image', () => {
    const img = makeImageData(16, 16, 255)
    const positions = samplePositionsFromAlpha(img, 100)
    expect(positions.length).toBeLessThanOrEqual(100 * 3)
    expect(positions.length).toBeGreaterThan(50 * 3)
  })

  it('returns empty for fully transparent image', () => {
    const img = makeImageData(16, 16, 0)
    const positions = samplePositionsFromAlpha(img, 100)
    expect(positions.length).toBe(0)
  })

  it('ignores low-alpha pixels (< 30)', () => {
    const img = makeImageData(16, 16, 20)
    const positions = samplePositionsFromAlpha(img, 100)
    expect(positions.length).toBe(0)
  })

  it('respects aspect ratio in x', () => {
    const img = makeImageData(2, 2, 255)
    const positions = samplePositionsFromAlpha(img, 100, 16 / 9)
    let maxX = 0
    for (let i = 0; i < positions.length; i += 3) {
      maxX = Math.max(maxX, Math.abs(positions[i]))
    }
    expect(maxX).toBeGreaterThan(1) // outside [-1,1] because aspect = 16/9
  })
})

describe('normalizeToRange', () => {
  it('maps 0/W → -aspect, W/W → +aspect', () => {
    expect(normalizeToRange(0, 100, 16 / 9)).toBeCloseTo(-16 / 9, 4)
    expect(normalizeToRange(100, 100, 16 / 9)).toBeCloseTo(16 / 9, 4)
  })

  it('maps W/2 → 0', () => {
    expect(normalizeToRange(50, 100, 1)).toBeCloseTo(0, 4)
  })
})

describe('PARTICLE_COUNTS', () => {
  it('high tier hub character is 80000', () => {
    expect(PARTICLE_COUNTS.high.hubCharacter).toBe(80000)
  })
  it('mid tier hub character is 50000', () => {
    expect(PARTICLE_COUNTS.mid.hubCharacter).toBe(50000)
  })
  it('low tier hub character is 15000', () => {
    expect(PARTICLE_COUNTS.low.hubCharacter).toBe(15000)
  })
})
