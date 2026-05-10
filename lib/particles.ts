import type { DeviceTier, ParticleConfig } from './types'

/**
 * Sample N particle positions from PNG alpha channel.
 * Returns Float32Array of [x, y, z, ...] in NDC-ish coordinates.
 */
export function samplePositionsFromAlpha(
  img: ImageData,
  n: number,
  aspect = 1
): Float32Array {
  const out: number[] = []
  const dW = img.width
  const dH = img.height
  const maxAttempts = n * 30
  let attempts = 0

  while (out.length / 3 < n && attempts < maxAttempts) {
    attempts++
    const x = Math.floor(Math.random() * dW)
    const y = Math.floor(Math.random() * dH)
    const idx = (y * dW + x) * 4
    const alpha = img.data[idx + 3]
    if (alpha > 30 && Math.random() < alpha / 255) {
      const nx = ((x / dW) * 2 - 1) * aspect
      const ny = -((y / dH) * 2 - 1)
      out.push(nx, ny, 0)
    }
  }

  return new Float32Array(out)
}

export function normalizeToRange(pixel: number, total: number, aspect: number): number {
  return (pixel / total - 0.5) * 2 * aspect
}

/** Particle counts per device tier (spec § 7 / § 10). */
export const PARTICLE_COUNTS: Record<DeviceTier, ParticleConfig> = {
  high: { hubCharacter: 80000, hubAmbient: 5000, entryHover: 70000, entryIdle: 4000 },
  mid: { hubCharacter: 50000, hubAmbient: 3000, entryHover: 40000, entryIdle: 2000 },
  low: { hubCharacter: 15000, hubAmbient: 800, entryHover: 8000, entryIdle: 500 },
}
