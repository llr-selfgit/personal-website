'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Yarn ball decoration as a particle cloud.
 *
 * The yarn PNG already includes drawn strands as part of the ball, so we
 * don't add a separate strand line — the ball just rolls along a surface.
 *
 * Physics:
 *   - Particles sampled from PNG with per-particle RGB (high fidelity).
 *   - Ball-local positions are cached once at load, then each frame are
 *     rotated by the current angle and translated to the ball center.
 *   - Rotation is locked to translation distance via circumference, so
 *     the ball rolls (no-slip).
 *   - Surface Y is fixed; the ball's center sits at surface + radius so
 *     the bottom of the ball touches the surface.
 */

interface Props {
  /** ball center starting world position (rest position, right end of roll). */
  start: [number, number, number]
  /** world units of horizontal travel (rolls -travelX..0 from start). */
  travelX: number
  /** ball world radius (used to lock rotation to translation). */
  radius: number
  /** scale multiplier applied to sampled ball-local positions. */
  scale?: number
  /** ball particle count. */
  count?: number
  /** seconds per full cycle. */
  periodSec?: number
}

export function YarnDecoration({
  start,
  travelX,
  radius,
  scale = 1,
  count = 15000,
  periodSec = 13,
}: Props) {
  const [data, setData] = useState<{
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } | null>(null)

  // Ball-local positions (centered on origin) preserved across frames so we
  // can apply rotation matrices without accumulating floating-point drift.
  const ballLocal = useRef<Float32Array | null>(null)
  const ballLive = useRef<Float32Array | null>(null)

  const groupRef = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points | null>(null)
  const startTime = useRef<number | null>(null)

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
      const { positions, colors } = samplePositionsAndColorsFromAlpha(imageData, count, 1)
      const n = positions.length / 3
      const sizes = new Float32Array(n)
      for (let i = 0; i < positions.length; i++) positions[i] *= scale
      for (let i = 0; i < n; i++) sizes[i] = 0.6 + Math.random() * 0.6
      ballLocal.current = new Float32Array(positions)
      ballLive.current = new Float32Array(positions)
      setData({ positions: ballLive.current, colors, sizes })
    }
    img.src = '/assets/cat/decorations/deco-cat-yarn.png'
  }, [count, scale])

  useEffect(() => {
    if (groupRef.current && data) {
      pointsRef.current = groupRef.current.children[0] as THREE.Points
    }
  }, [data])

  useFrame((state) => {
    if (!data || !ballLocal.current || !ballLive.current) return
    if (startTime.current === null) startTime.current = state.clock.elapsedTime

    const t = ((state.clock.elapsedTime - startTime.current) % periodSec) / periodSec
    const u = (1 - Math.cos(t * 2 * Math.PI)) / 2 // 0..1..0, eased at endpoints
    const ballCenterX = start[0] - u * travelX
    const distanceTravelled = u * travelX
    // Sign chosen so the ball rolls in the direction of travel (left → ccw seen from front).
    const rotation = -(distanceTravelled / radius)

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const local = ballLocal.current
    const live = ballLive.current
    for (let i = 0; i < local.length; i += 3) {
      const lx = local[i]
      const ly = local[i + 1]
      live[i] = ballCenterX + (lx * cos - ly * sin)
      live[i + 1] = start[1] + (lx * sin + ly * cos)
      live[i + 2] = start[2]
    }
    if (pointsRef.current?.geometry.attributes.position) {
      ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef}>
      <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
    </group>
  )
}
