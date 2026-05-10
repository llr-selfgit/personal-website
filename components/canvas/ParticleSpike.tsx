'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsFromAlpha } from '@/lib/particles'
import { RippleManager, computeRippleForce, DEFAULT_RIPPLE_PARAMS } from '@/lib/ripple'

interface Props {
  count: number
  src: string
}

const RIPPLE_NDC = {
  ...DEFAULT_RIPPLE_PARAMS,
  // 把 px 单位的 spec 参数映射到 NDC（cam dist=5, fov=50, 屏幕高 ~5 NDC 单位）
  // 假设视口高 ~900px，1 px ≈ 5/900 ≈ 0.0056 NDC
  speed: 0.4,         // ~220 px/s × 0.0018 (实测调整)
  maxRadius: 0.3,     // ~130px → ~0.3 NDC
  bandThickness: 0.04,
  pushStrength: 0.05,
}

export function ParticleSpike({ count, src }: Props) {
  const { camera, viewport } = useThree()
  const [data, setData] = useState<{ positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null>(null)
  const velocities = useRef<Float32Array | null>(null)
  const origins = useRef<Float32Array | null>(null)
  const ripples = useRef(new RippleManager(RIPPLE_NDC))

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const positions = samplePositionsFromAlpha(imageData, count, 1)
      const n = positions.length / 3
      const colors = new Float32Array(n * 3)
      const sizes = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        // sepia palette (cat)
        colors[i * 3] = 0.85
        colors[i * 3 + 1] = 0.7
        colors[i * 3 + 2] = 0.55
        sizes[i] = 1 + Math.random() * 1.5
      }
      origins.current = new Float32Array(positions)
      velocities.current = new Float32Array(positions.length)
      setData({ positions, colors, sizes })
    }
    img.src = src
  }, [count, src])

  // Pointer events for ripple
  useEffect(() => {
    const el = document.querySelector('canvas')
    if (!el) return
    const onPointerMove = (e: PointerEvent) => {
      const rect = (el as HTMLElement).getBoundingClientRect()
      // Map pointer to NDC matching camera plane at z=0
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      // Scale to world units at camera dist (assumes camera z=5, fov=50)
      const worldHeight = 2 * Math.tan((50 * Math.PI) / 360) * 5
      const worldWidth = worldHeight * (rect.width / rect.height)
      const wx = ndcX * worldWidth * 0.5
      const wy = ndcY * worldHeight * 0.5
      ripples.current.spawn(wx, wy, performance.now())
    }
    el.addEventListener('pointermove', onPointerMove)
    return () => el.removeEventListener('pointermove', onPointerMove)
  }, [])

  useFrame(() => {
    if (!data || !velocities.current || !origins.current) return
    const now = performance.now()
    ripples.current.tick(now)
    const active = ripples.current.getRipples()
    const SPRING = 0.06, DAMP = 0.85
    const positions = data.positions

    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i], py = positions[i + 1]
      const ox = origins.current[i], oy = origins.current[i + 1]
      let fx = 0, fy = 0
      for (let k = 0; k < active.length; k++) {
        const force = computeRippleForce({
          particleX: px, particleY: py,
          ripple: active[k],
          currentTime: now,
          params: RIPPLE_NDC,
        })
        fx += force.x; fy += force.y
      }
      // Spring back to origin
      fx += (ox - px) * SPRING
      fy += (oy - py) * SPRING

      velocities.current[i] = velocities.current[i] * DAMP + fx
      velocities.current[i + 1] = velocities.current[i + 1] * DAMP + fy
      positions[i] += velocities.current[i]
      positions[i + 1] += velocities.current[i + 1]
    }
    // Mark BufferAttribute as needing update — done implicitly by mutating array if THREE.BufferAttribute.needsUpdate is set externally.
    // For simplicity in spike, recreate geometry every N frames; better path: ParticleField API to expose attribute.
  })

  if (!data) return null
  return <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
}
