'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Yarn ball decoration as a particle cloud.
 *
 * Particles are sampled from the PNG alpha with per-particle RGB color
 * (high-fidelity reproduction, not silhouette). The whole cloud translates
 * + rotates as a rigid body so it rolls. A separate strand particle line
 * connects the spool anchor to the ball center; strand particles are placed
 * each frame along the current spool→ball segment so the line truly grows
 * and shrinks with the ball position.
 */

interface Props {
  /** ball center world position when at rest (right end of the roll). */
  spool: [number, number, number]
  /** world units of horizontal travel (ball rolls -travelX..0 from spool). */
  travelX: number
  /** ball world radius (used for rotation lock). */
  radius: number
  /** scale multiplier applied to particle positions before the radius takes effect. */
  scale?: number
  /** ball particle count. */
  ballCount?: number
  /** strand particle count (rendered along the strand line, redistributed each frame). */
  strandCount?: number
  /** seconds per full cycle. */
  periodSec?: number
}

const STRAND_INK: [number, number, number] = [0.23, 0.15, 0.07]

export function YarnDecoration({
  spool,
  travelX,
  radius,
  scale = 1,
  ballCount = 20000,
  strandCount = 800,
  periodSec = 13,
}: Props) {
  const [ballData, setBallData] = useState<{
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } | null>(null)

  // Original ball-local positions (relative to centroid) — preserved across frames
  // so we can apply the rotation matrix without accumulating error.
  const ballLocal = useRef<Float32Array | null>(null)
  // Live (per-frame) ball positions in world space — what the GPU buffer reads.
  const ballLive = useRef<Float32Array | null>(null)

  const groupRef = useRef<THREE.Group>(null!)
  const ballPointsRef = useRef<THREE.Points | null>(null)
  const strandPointsRef = useRef<THREE.Points | null>(null)

  const [strandData, setStrandData] = useState<{
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } | null>(null)
  // Pre-allocated strand positions (length strandCount * 3); updated in place each frame.
  const strandPositions = useRef<Float32Array | null>(null)

  const startTime = useRef<number | null>(null)

  // Load the yarn PNG and sample particles + colors
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
      const { positions, colors } = samplePositionsAndColorsFromAlpha(imageData, ballCount, 1)
      const n = positions.length / 3
      const sizes = new Float32Array(n)
      // Scale ball-local positions so the ball's apparent radius matches the prop.
      // Sampling outputs are in ±1 NDC. Multiply by scale to fit world units.
      for (let i = 0; i < positions.length; i++) positions[i] *= scale
      for (let i = 0; i < n; i++) sizes[i] = 0.6 + Math.random() * 0.6
      ballLocal.current = new Float32Array(positions)
      ballLive.current = new Float32Array(positions)
      setBallData({ positions: ballLive.current, colors, sizes })
    }
    img.src = '/assets/cat/decorations/deco-cat-yarn.png'
  }, [ballCount, scale])

  // Prepare strand buffers once
  useEffect(() => {
    const positions = new Float32Array(strandCount * 3)
    const colors = new Float32Array(strandCount * 3)
    const sizes = new Float32Array(strandCount)
    for (let i = 0; i < strandCount; i++) {
      colors[i * 3] = STRAND_INK[0]
      colors[i * 3 + 1] = STRAND_INK[1]
      colors[i * 3 + 2] = STRAND_INK[2]
      sizes[i] = 0.7 + Math.random() * 0.4
    }
    strandPositions.current = positions
    setStrandData({ positions, colors, sizes })
  }, [strandCount])

  // Cache the THREE.Points refs once children mount
  useEffect(() => {
    if (groupRef.current && ballData && strandData) {
      ballPointsRef.current = groupRef.current.children[0] as THREE.Points
      strandPointsRef.current = groupRef.current.children[1] as THREE.Points
    }
  }, [ballData, strandData])

  useFrame((state) => {
    if (!ballData || !strandData || !ballLocal.current || !ballLive.current || !strandPositions.current) return
    if (startTime.current === null) startTime.current = state.clock.elapsedTime

    const t = ((state.clock.elapsedTime - startTime.current) % periodSec) / periodSec
    // Smooth cosine for ease at endpoints
    const u = (1 - Math.cos(t * 2 * Math.PI)) / 2 // 0..1..0
    const ballCenterX = spool[0] - u * travelX
    const distanceTravelled = u * travelX
    // Rotation = distance / circumference * 2π
    const rotation = -(distanceTravelled / (2 * Math.PI * radius)) * 2 * Math.PI

    // Update ball positions: apply rotation matrix to each ball-local point,
    // then translate to current ball center.
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const local = ballLocal.current
    const live = ballLive.current
    for (let i = 0; i < local.length; i += 3) {
      const lx = local[i]
      const ly = local[i + 1]
      live[i] = ballCenterX + (lx * cos - ly * sin)
      live[i + 1] = spool[1] + (lx * sin + ly * cos)
      live[i + 2] = spool[2]
    }
    if (ballPointsRef.current?.geometry.attributes.position) {
      ;(ballPointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }

    // Update strand: distribute strandCount points along the segment from spool
    // to ball center, with a slight downward sag in the middle.
    const strandLen = spool[0] - ballCenterX
    const sag = Math.min(strandLen * 0.06, 0.04)
    const sp = strandPositions.current
    const count = sp.length / 3
    for (let i = 0; i < count; i++) {
      const s = i / Math.max(1, count - 1) // 0 (spool) .. 1 (ball)
      const x = spool[0] - s * strandLen
      // Parabolic sag — max at midpoint
      const y = spool[1] - 4 * sag * s * (1 - s)
      sp[i * 3] = x
      sp[i * 3 + 1] = y
      sp[i * 3 + 2] = spool[2]
    }
    if (strandPointsRef.current?.geometry.attributes.position) {
      ;(strandPointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!ballData || !strandData) return null

  return (
    <group ref={groupRef}>
      <ParticleField positions={ballData.positions} colors={ballData.colors} sizes={ballData.sizes} />
      <ParticleField positions={strandData.positions} colors={strandData.colors} sizes={strandData.sizes} />
    </group>
  )
}
