import type { RippleParams, Ripple } from './types'

export class RippleManager {
  private ripples: Ripple[] = []
  private lastSpawnTime = -Infinity

  constructor(private params: RippleParams) {}

  spawn(x: number, y: number, now: number): void {
    if (now - this.lastSpawnTime < this.params.spawnInterval) return
    if (this.ripples.length >= this.params.maxConcurrent) {
      this.ripples.shift() // drop oldest
    }
    this.ripples.push({ x, y, t: now })
    this.lastSpawnTime = now
  }

  tick(now: number): void {
    const maxAgeMs = (this.params.maxRadius / this.params.speed) * 1000
    this.ripples = this.ripples.filter((r) => now - r.t < maxAgeMs)
  }

  getActiveCount(): number {
    return this.ripples.length
  }

  getRipples(): readonly Ripple[] {
    return this.ripples
  }
}

export interface RippleForceInput {
  particleX: number
  particleY: number
  ripple: Ripple
  currentTime: number
  params: RippleParams
}

export function computeRippleForce(input: RippleForceInput): { x: number; y: number } {
  const { particleX, particleY, ripple, currentTime, params } = input
  const dx = particleX - ripple.x
  const dy = particleY - ripple.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1e-4) return { x: 0, y: 0 }

  const ageS = (currentTime - ripple.t) / 1000
  const ringR = ageS * params.speed
  if (ringR > params.maxRadius) return { x: 0, y: 0 }

  const offset = Math.abs(dist - ringR)
  if (offset >= params.bandThickness) return { x: 0, y: 0 }

  const intensity = (1 - offset / params.bandThickness) * (1 - ringR / params.maxRadius)
  const f = params.pushStrength * intensity
  return { x: (dx / dist) * f, y: (dy / dist) * f }
}

/** Default ripple params from spec § 7 (in pixel units). */
export const DEFAULT_RIPPLE_PARAMS: RippleParams = {
  speed: 220,
  maxRadius: 130,
  bandThickness: 20,
  pushStrength: 4,
  spawnInterval: 130,
  maxConcurrent: 4,
}
