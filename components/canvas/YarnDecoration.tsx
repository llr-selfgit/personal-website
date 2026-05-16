'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Yarn ball decoration with ball + dynamic strand.
 *
 * Two pools, classified once at load from a centroid distance threshold:
 *   - Ball pool: rotates + translates as a rigid body (rolling no-slip).
 *   - Strand pool: each particle has a deployment threshold t_i in [0, 1].
 *     The ball's rolling progress u ∈ [0, 1] gates visibility — a particle
 *     is visible iff t_i ≤ u. Visible particles sit at their assigned
 *     position along the strand line from anchor → ball end. As u grows,
 *     more particles deploy → strand grows. As u shrinks, particles
 *     undeploy in reverse → strand winds back into the ball.
 *
 * Linear density along the strand stays roughly constant: particles are
 * uniformly distributed in t over the max-length strand, so the visible
 * count scales with current length.
 */

interface Props {
  /** ball-cloud centroid rest position in world coordinates. */
  start: [number, number, number]
  /** world units of horizontal travel (rolls -travelX..0 from start). */
  travelX: number
  /** ball world radius (used to lock rotation to translation). */
  radius: number
  /** scale multiplier applied to sampled NDC positions. */
  scale?: number
  /** total particles requested. */
  count?: number
  /** seconds per full cycle. */
  periodSec?: number
  /** Distance-from-centroid fraction; outliers above this become strand. */
  strandThreshold?: number
  /** Y-jitter for strand particles (world units, organic thickness). */
  strandJitter?: number
}

interface BallPool {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

interface StrandPool {
  positions: Float32Array    // updated each frame
  colors: Float32Array        // static (PNG colors)
  sizes: Float32Array          // updated each frame (baseSize or 0)
  baseSizes: Float32Array       // when deployed
  t: Float32Array                // deployment threshold per particle
  perpJitter: Float32Array     // per-particle Y offset
}

interface Classified {
  ball: BallPool
  strand: StrandPool
  /** ball centroid Y in scaled local coords — used to set ball group Y. */
  centroidY: number
}

function classify(
  positions: Float32Array,
  colors: Float32Array,
  scale: number,
  thresholdFrac: number,
  jitter: number,
): Classified {
  const n = positions.length / 3

  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += positions[i * 3]
    cy += positions[i * 3 + 1]
  }
  cx /= n
  cy /= n

  const dists = new Float32Array(n)
  let maxDist = 0
  for (let i = 0; i < n; i++) {
    const dx = positions[i * 3] - cx
    const dy = positions[i * 3 + 1] - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    dists[i] = d
    if (d > maxDist) maxDist = d
  }
  const threshold = maxDist * thresholdFrac

  let ballN = 0
  let strandN = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) ballN++
    else strandN++
  }

  const ballPositions = new Float32Array(ballN * 3)
  const ballColors = new Float32Array(ballN * 3)
  const ballSizes = new Float32Array(ballN)
  const strandColors = new Float32Array(strandN * 3)
  const strandBaseSizes = new Float32Array(strandN)
  const strandT = new Float32Array(strandN)
  const strandPerpJitter = new Float32Array(strandN)

  let bi = 0
  let si = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      ballPositions[bi * 3] = (positions[i * 3] - cx) * scale
      ballPositions[bi * 3 + 1] = (positions[i * 3 + 1] - cy) * scale
      ballPositions[bi * 3 + 2] = 0
      ballColors[bi * 3] = colors[i * 3]
      ballColors[bi * 3 + 1] = colors[i * 3 + 1]
      ballColors[bi * 3 + 2] = colors[i * 3 + 2]
      ballSizes[bi] = 0.55 + Math.random() * 0.55
      bi++
    } else {
      strandColors[si * 3] = colors[i * 3]
      strandColors[si * 3 + 1] = colors[i * 3 + 1]
      strandColors[si * 3 + 2] = colors[i * 3 + 2]
      strandBaseSizes[si] = 0.5 + Math.random() * 0.45
      strandPerpJitter[si] = (Math.random() - 0.5) * 2 * jitter
      si++
    }
  }

  // Assign deployment thresholds uniformly in [0, 1]. Particle index 0
  // deploys first (anchor end); last index deploys last (ball end).
  for (let i = 0; i < strandN; i++) {
    strandT[i] = strandN > 1 ? i / (strandN - 1) : 0
  }

  return {
    ball: { positions: ballPositions, colors: ballColors, sizes: ballSizes },
    strand: {
      positions: new Float32Array(strandN * 3), // updated each frame
      colors: strandColors,
      sizes: new Float32Array(strandN), // updated each frame
      baseSizes: strandBaseSizes,
      t: strandT,
      perpJitter: strandPerpJitter,
    },
    centroidY: cy * scale,
  }
}

export function YarnDecoration({
  start,
  travelX,
  radius,
  scale = 1,
  count = 15000,
  periodSec = 13,
  strandThreshold = 0.55,
  strandJitter = 0.012,
}: Props) {
  const [data, setData] = useState<Classified | null>(null)
  const ballGroupRef = useRef<THREE.Group>(null!)
  const strandGroupRef = useRef<THREE.Group>(null!)
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
      setData(classify(positions, colors, scale, strandThreshold, strandJitter))
    }
    img.src = '/assets/cat/decorations/deco-cat-yarn.png'
  }, [count, scale, strandThreshold, strandJitter])

  // Strand anchor world position — fixed at start (ball rest center).
  // The strand extends FROM this anchor TO the current ball center.
  const anchorY = useMemo(() => (data ? start[1] + data.centroidY : start[1]), [data, start])

  useFrame((state) => {
    if (!data) return
    if (startTime.current === null) startTime.current = state.clock.elapsedTime
    const t = ((state.clock.elapsedTime - startTime.current) % periodSec) / periodSec
    const u = (1 - Math.cos(t * 2 * Math.PI)) / 2 // 0..1..0, eased at endpoints
    const distance = u * travelX
    const rotation = -(distance / radius)

    // Ball group transform — translate to current ball center, rotate.
    if (ballGroupRef.current) {
      ballGroupRef.current.position.set(start[0] - distance, anchorY, start[2])
      ballGroupRef.current.rotation.z = rotation
    }

    // Strand deployment — set each particle's position and size based on u.
    const strand = data.strand
    const sP = strand.positions
    const sS = strand.sizes
    const sT = strand.t
    const sJ = strand.perpJitter
    const sBase = strand.baseSizes
    const n = sT.length
    for (let i = 0; i < n; i++) {
      const ti = sT[i]
      if (ti <= u + 0.0001) {
        // Deployed: position along the max-length strand from anchor.
        sP[i * 3] = start[0] - ti * travelX
        sP[i * 3 + 1] = anchorY + sJ[i]
        sP[i * 3 + 2] = start[2]
        sS[i] = sBase[i]
      } else {
        sS[i] = 0
      }
    }
    const strandPoints = strandGroupRef.current?.children[0] as THREE.Points | undefined
    if (strandPoints) {
      const posAttr = strandPoints.geometry.attributes.position as THREE.BufferAttribute | undefined
      const sizeAttr = strandPoints.geometry.attributes.aSize as THREE.BufferAttribute | undefined
      if (posAttr) posAttr.needsUpdate = true
      if (sizeAttr) sizeAttr.needsUpdate = true
    }
  })

  if (!data) return null

  return (
    <>
      {/* Strand — positions are world coordinates (not relative to a group). */}
      <group ref={strandGroupRef}>
        <ParticleField
          positions={data.strand.positions}
          colors={data.strand.colors}
          sizes={data.strand.sizes}
        />
      </group>
      {/* Ball — group transform animated. */}
      <group ref={ballGroupRef}>
        <ParticleField
          positions={data.ball.positions}
          colors={data.ball.colors}
          sizes={data.ball.sizes}
        />
      </group>
    </>
  )
}
