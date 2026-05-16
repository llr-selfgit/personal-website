'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Yarn ball with dynamic unspool/respool strand.
 *
 * Pipeline at load:
 *   1. Sample PNG → positions + colors (NDC).
 *   2. Two-pass classification by distance from centroid:
 *        - Pass 1: classify against the overall centroid (biased toward
 *          the strand side).
 *        - Pass 2: recompute centroid using only "ball" particles from
 *          pass 1, then reclassify. This removes the strand-bias drift.
 *   3. Compute actual ball radius = max distance of any ball particle
 *      from the ball-only centroid (in world units after `scale`).
 *   4. Ball-local positions are centered on the ball-only centroid.
 *
 * Animation per frame:
 *   - u = (1 - cos(2π t)) / 2 ∈ [0,1], smooth oscillation.
 *   - Ball group transform: position (start.x - u·travelX, start.y),
 *     rotation +distance/radius (CCW outbound, CW inbound, no-slip).
 *   - Strand particle i is visible iff t_i ≤ u; its position is fixed
 *     along the line from anchor (start.x) to ball.x at fraction t_i.
 *     Y stays at floor (start.y − ballRadius) plus jitter + three sine
 *     waves for an organic curl, never a straight line.
 */

interface Props {
  /** ball-center rest position in world coordinates. Strand anchor sits at start.x. */
  start: [number, number, number]
  /** world units of horizontal travel (rolls -travelX..0 from start). */
  travelX: number
  /** scale multiplier applied to sampled NDC positions. */
  scale?: number
  /** total particles requested. */
  count?: number
  /** seconds per full cycle. */
  periodSec?: number
  /** Outliers above this fraction (0..1) of max distance become strand. */
  strandThreshold?: number
  /** Y-jitter for strand particles (world units). */
  strandJitter?: number
  /** Cap on strand particle count. Lower = thinner, more line-like. */
  maxStrandCount?: number
}

interface BallPool {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

interface StrandPool {
  positions: Float32Array  // updated each frame
  colors: Float32Array      // static
  sizes: Float32Array        // updated each frame
  baseSizes: Float32Array     // when deployed
  t: Float32Array              // deployment threshold
  perpJitter: Float32Array   // per-particle stable Y offset
}

interface Classified {
  ball: BallPool
  strand: StrandPool
  /** actual ball radius in world units (max dist from ball centroid). */
  ballRadius: number
}

function classify(
  positions: Float32Array,
  colors: Float32Array,
  scale: number,
  thresholdFrac: number,
  jitter: number,
  maxStrandCount: number,
): Classified {
  const n = positions.length / 3

  // Pass 1: classify around overall centroid
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += positions[i * 3]
    cy += positions[i * 3 + 1]
  }
  cx /= n
  cy /= n

  function classifyAround(centerX: number, centerY: number) {
    const dists = new Float32Array(n)
    let maxDist = 0
    for (let i = 0; i < n; i++) {
      const dx = positions[i * 3] - centerX
      const dy = positions[i * 3 + 1] - centerY
      const d = Math.sqrt(dx * dx + dy * dy)
      dists[i] = d
      if (d > maxDist) maxDist = d
    }
    return { dists, threshold: maxDist * thresholdFrac }
  }

  let { dists, threshold } = classifyAround(cx, cy)

  // Pass 2: recompute centroid using only "ball" particles, then reclassify
  let bcx = 0
  let bcy = 0
  let ballN = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      bcx += positions[i * 3]
      bcy += positions[i * 3 + 1]
      ballN++
    }
  }
  if (ballN > 0) {
    bcx /= ballN
    bcy /= ballN
  }
  ;({ dists, threshold } = classifyAround(bcx, bcy))

  // Final ball-only centroid from this pass
  bcx = 0
  bcy = 0
  ballN = 0
  let strandN = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      bcx += positions[i * 3]
      bcy += positions[i * 3 + 1]
      ballN++
    } else {
      strandN++
    }
  }
  if (ballN > 0) {
    bcx /= ballN
    bcy /= ballN
  }

  // Ball radius = max distance of any ball particle from ball-only centroid
  let ballRadiusNDC = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      const dx = positions[i * 3] - bcx
      const dy = positions[i * 3 + 1] - bcy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > ballRadiusNDC) ballRadiusNDC = d
    }
  }
  const ballRadius = ballRadiusNDC * scale

  // Cap strand particle count to keep the line thin (avoids the "fabric"
  // look when too many particles pile up along the strand).
  const strandKeepProb = strandN > maxStrandCount ? maxStrandCount / strandN : 1
  const finalStrandN = Math.min(strandN, maxStrandCount)

  // Allocate pools
  const ballPositions = new Float32Array(ballN * 3)
  const ballColors = new Float32Array(ballN * 3)
  const ballSizes = new Float32Array(ballN)
  const strandColors = new Float32Array(finalStrandN * 3)
  const strandBaseSizes = new Float32Array(finalStrandN)
  const strandT = new Float32Array(finalStrandN)
  const strandPerpJitter = new Float32Array(finalStrandN)

  let bi = 0
  let si = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      // Ball-local positions centered on the ball-only centroid
      ballPositions[bi * 3] = (positions[i * 3] - bcx) * scale
      ballPositions[bi * 3 + 1] = (positions[i * 3 + 1] - bcy) * scale
      ballPositions[bi * 3 + 2] = 0
      ballColors[bi * 3] = colors[i * 3]
      ballColors[bi * 3 + 1] = colors[i * 3 + 1]
      ballColors[bi * 3 + 2] = colors[i * 3 + 2]
      ballSizes[bi] = 0.55 + Math.random() * 0.55
      bi++
    } else if (si < finalStrandN && Math.random() < strandKeepProb) {
      strandColors[si * 3] = colors[i * 3]
      strandColors[si * 3 + 1] = colors[i * 3 + 1]
      strandColors[si * 3 + 2] = colors[i * 3 + 2]
      strandBaseSizes[si] = 0.5 + Math.random() * 0.45
      strandPerpJitter[si] = (Math.random() - 0.5) * 2 * jitter
      si++
    }
  }
  const actualStrandN = si

  for (let i = 0; i < actualStrandN; i++) {
    strandT[i] = actualStrandN > 1 ? i / (actualStrandN - 1) : 0
  }

  return {
    ball: { positions: ballPositions, colors: ballColors, sizes: ballSizes },
    strand: {
      positions: new Float32Array(actualStrandN * 3),
      colors: actualStrandN === finalStrandN ? strandColors : strandColors.slice(0, actualStrandN * 3),
      sizes: new Float32Array(actualStrandN),
      baseSizes:
        actualStrandN === finalStrandN ? strandBaseSizes : strandBaseSizes.slice(0, actualStrandN),
      t: actualStrandN === finalStrandN ? strandT : strandT.slice(0, actualStrandN),
      perpJitter:
        actualStrandN === finalStrandN ? strandPerpJitter : strandPerpJitter.slice(0, actualStrandN),
    },
    ballRadius,
  }
}

export function YarnDecoration({
  start,
  travelX,
  scale = 1,
  count = 15000,
  periodSec = 13,
  strandThreshold = 0.55,
  strandJitter = 0.004,
  maxStrandCount = 700,
}: Props) {
  const [data, setData] = useState<Classified | null>(null)
  const ballGroupRef = useRef<THREE.Group>(null!)
  const strandGroupRef = useRef<THREE.Group>(null!)

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
      setData(classify(positions, colors, scale, strandThreshold, strandJitter, maxStrandCount))
    }
    img.src = '/assets/cat/decorations/deco-cat-yarn.png'
  }, [count, scale, strandThreshold, strandJitter, maxStrandCount])

  useFrame((state) => {
    if (!data) return
    // Use canvas-shared clock directly (no internal startTime) so the
    // cycle is phase-locked with anything else using state.clock.elapsedTime
    // — specifically the cat's breathing in AnimalCharacter.
    const elapsed = state.clock.elapsedTime
    const u = (1 - Math.cos((elapsed * 2 * Math.PI) / periodSec)) / 2
    const distance = u * travelX
    const rotation = +(distance / data.ballRadius) // CCW outbound, CW inbound

    // Strand floor = ball center Y minus actual ball radius
    const strandY = start[1] - data.ballRadius

    // Ball group: at (start.x - distance, start.y, start.z). Ball-local
    // positions are already centered on the ball-only centroid, so the
    // visible ball mass is at the group's origin.
    if (ballGroupRef.current) {
      ballGroupRef.current.position.set(start[0] - distance, start[1], start[2])
      ballGroupRef.current.rotation.z = rotation
    }

    // Strand particles: deployed iff t_i ≤ u; positioned along the segment
    // from anchor (start.x) to ball.x. Y has stable jitter + 3 sin waves for
    // organic irregularity.
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
        sP[i * 3] = start[0] - ti * travelX
        // Tight wave amplitudes — yarn line should be a few pixels tall,
        // not a thick band. Three frequencies with random phases keep it
        // organic / irregular instead of a perfect sine wave.
        const wave1 = 0.010 * Math.sin(ti * 8.7 + sJ[i] * 91)
        const wave2 = 0.005 * Math.sin(ti * 21.3 + sJ[i] * 37)
        const wave3 = 0.0025 * Math.sin(ti * 53.1 + sJ[i] * 19)
        sP[i * 3 + 1] = strandY + sJ[i] + wave1 + wave2 + wave3
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
      <group ref={strandGroupRef}>
        <ParticleField
          positions={data.strand.positions}
          colors={data.strand.colors}
          sizes={data.strand.sizes}
        />
      </group>
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
