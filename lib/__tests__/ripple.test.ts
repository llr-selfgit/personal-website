import { describe, it, expect } from 'vitest'
import { computeRippleForce } from '../ripple'

describe('computeRippleForce — world units (small distances)', () => {
  it('returns non-zero force when particle is 0.05 from ripple center (world units)', () => {
    const force = computeRippleForce({
      particleX: 0.05,
      particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 100, // 0.1s after spawn
      params: {
        speed: 0.8,
        maxRadius: 0.6,
        bandThickness: 0.08,
        pushStrength: 0.12,
        spawnInterval: 130,
        maxConcurrent: 4,
      },
    })
    // ringR at t=0.1s with speed=0.8 is 0.08. dist=0.05. offset=0.03 < bandThickness 0.08 → in band → non-zero
    expect(Math.abs(force.x)).toBeGreaterThan(0)
  })
})
