import { describe, it, expect } from 'vitest'
import { RippleManager, computeRippleForce, DEFAULT_RIPPLE_PARAMS } from '@/lib/ripple'

describe('RippleManager', () => {
  it('respects spawnInterval', () => {
    const mgr = new RippleManager({ ...DEFAULT_RIPPLE_PARAMS, spawnInterval: 100 })
    expect(mgr.getActiveCount()).toBe(0)
    mgr.spawn(0, 0, 0)
    expect(mgr.getActiveCount()).toBe(1)
    mgr.spawn(10, 10, 50) // before interval → ignored
    expect(mgr.getActiveCount()).toBe(1)
    mgr.spawn(20, 20, 200) // after → spawned
    expect(mgr.getActiveCount()).toBe(2)
  })

  it('expires rings older than maxRadius/speed', () => {
    const mgr = new RippleManager({ ...DEFAULT_RIPPLE_PARAMS, speed: 100, maxRadius: 100, spawnInterval: 0 })
    mgr.spawn(0, 0, 0)
    expect(mgr.getActiveCount()).toBe(1)
    mgr.tick(2000) // 2s × 100 px/s = 200px > 100 max
    expect(mgr.getActiveCount()).toBe(0)
  })

  it('caps active rings at maxConcurrent', () => {
    const mgr = new RippleManager({ ...DEFAULT_RIPPLE_PARAMS, spawnInterval: 0, maxConcurrent: 4 })
    for (let i = 0; i < 10; i++) mgr.spawn(i, 0, i)
    expect(mgr.getActiveCount()).toBe(4)
  })
})

describe('computeRippleForce', () => {
  it('pushes particle outward when in band', () => {
    const force = computeRippleForce({
      particleX: 100, particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 1000, // ringR = 100 (matches dist exactly)
      params: { ...DEFAULT_RIPPLE_PARAMS, speed: 100, maxRadius: 200 },
    })
    expect(force.x).toBeGreaterThan(0)
    expect(force.y).toBeCloseTo(0, 4)
  })

  it('zero force outside band', () => {
    const force = computeRippleForce({
      particleX: 200, particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 1000, // ringR = 100, particle at 200 → 100px offset > band 20
      params: { ...DEFAULT_RIPPLE_PARAMS, speed: 100, maxRadius: 300 },
    })
    expect(force.x).toBe(0)
    expect(force.y).toBe(0)
  })

  it('zero force after ring expired', () => {
    const force = computeRippleForce({
      particleX: 50, particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 5000, // ringR = 500 > maxRadius
      params: { ...DEFAULT_RIPPLE_PARAMS, speed: 100, maxRadius: 100 },
    })
    expect(force.x).toBe(0)
  })
})
