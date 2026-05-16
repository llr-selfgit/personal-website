'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Yarn ball decoration with ball / strand separation.
 *
 * The source PNG contains both the round yarn mass AND a visible strand
 * tail. We classify each sampled particle as "ball" or "strand" by its
 * distance from the cloud's centroid:
 *   - Ball particles (close to centroid): rotate + translate as a rigid
 *     body, so the ball rolls.
 *   - Strand particles (outliers): stay pinned in world space at their
 *     PNG-sampled position. As the ball rolls away, the strand stays put
 *     — yarn unspooling. When the ball returns, it re-approaches its
 *     strand.
 *
 * Threshold for the split is a fraction of max distance from centroid.
 * Tunable via the `strandThreshold` prop if a specific PNG needs it.
 */

interface Props {
  /** ball-cloud centroid starting world position (rest position). */
  start: [number, number, number]
  /** world units of horizontal travel (rolls -travelX..0 from start). */
  travelX: number
  /** ball world radius (used to lock rotation to translation). */
  radius: number
  /** scale multiplier applied to sampled local positions. */
  scale?: number
  /** total particles requested. */
  count?: number
  /** seconds per full cycle. */
  periodSec?: number
  /**
   * Particles farther than this fraction (0..1) of max distance from the
   * cloud centroid are classified as strand. Default 0.55 works for the
   * cat yarn PNG.
   */
  strandThreshold?: number
}

interface ClassifiedData {
  ball: { positions: Float32Array; colors: Float32Array; sizes: Float32Array }
  strand: { positions: Float32Array; colors: Float32Array; sizes: Float32Array }
  /** centroid in scaled local coords — used to anchor the ball group's Y. */
  centroidY: number
}

function classify(
  positions: Float32Array,
  colors: Float32Array,
  scale: number,
  thresholdFrac: number,
): ClassifiedData {
  const n = positions.length / 3

  // Centroid in NDC (pre-scale)
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += positions[i * 3]
    cy += positions[i * 3 + 1]
  }
  cx /= n
  cy /= n

  // Compute distance from centroid for each particle
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

  // Two passes: count, then fill (avoid push() growth costs)
  let ballN = 0
  let strandN = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) ballN++
    else strandN++
  }

  const ballPos = new Float32Array(ballN * 3)
  const ballCol = new Float32Array(ballN * 3)
  const ballSize = new Float32Array(ballN)
  const strandPos = new Float32Array(strandN * 3)
  const strandCol = new Float32Array(strandN * 3)
  const strandSize = new Float32Array(strandN)

  let bi = 0
  let si = 0
  for (let i = 0; i < n; i++) {
    if (dists[i] <= threshold) {
      // Ball-local: subtract centroid, then apply scale. Rotation will be
      // around (0,0) of this local space, which corresponds to the ball
      // mass centroid — visually correct rolling axis.
      ballPos[bi * 3] = (positions[i * 3] - cx) * scale
      ballPos[bi * 3 + 1] = (positions[i * 3 + 1] - cy) * scale
      ballPos[bi * 3 + 2] = 0
      ballCol[bi * 3] = colors[i * 3]
      ballCol[bi * 3 + 1] = colors[i * 3 + 1]
      ballCol[bi * 3 + 2] = colors[i * 3 + 2]
      ballSize[bi] = 0.55 + Math.random() * 0.55
      bi++
    } else {
      // Strand: keep at original NDC * scale position (relative to the start
      // anchor). They never move.
      strandPos[si * 3] = positions[i * 3] * scale
      strandPos[si * 3 + 1] = positions[i * 3 + 1] * scale
      strandPos[si * 3 + 2] = 0
      strandCol[si * 3] = colors[i * 3]
      strandCol[si * 3 + 1] = colors[i * 3 + 1]
      strandCol[si * 3 + 2] = colors[i * 3 + 2]
      strandSize[si] = 0.5 + Math.random() * 0.4
      si++
    }
  }

  return {
    ball: { positions: ballPos, colors: ballCol, sizes: ballSize },
    strand: { positions: strandPos, colors: strandCol, sizes: strandSize },
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
}: Props) {
  const [data, setData] = useState<ClassifiedData | null>(null)
  const ballGroupRef = useRef<THREE.Group>(null!)
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
      setData(classify(positions, colors, scale, strandThreshold))
    }
    img.src = '/assets/cat/decorations/deco-cat-yarn.png'
  }, [count, scale, strandThreshold])

  useFrame((state) => {
    if (!ballGroupRef.current || !data) return
    if (startTime.current === null) startTime.current = state.clock.elapsedTime

    const t = ((state.clock.elapsedTime - startTime.current) % periodSec) / periodSec
    const u = (1 - Math.cos(t * 2 * Math.PI)) / 2 // 0..1..0, eased at endpoints
    const distance = u * travelX
    const rotation = -(distance / radius)

    // Ball group's origin = ball centroid in world space.
    // At rest the ball centroid sits at (start[0], start[1] + centroidY).
    // As it rolls, only X changes.
    ballGroupRef.current.position.set(start[0] - distance, start[1] + data.centroidY, start[2])
    ballGroupRef.current.rotation.z = rotation
  })

  if (!data) return null

  return (
    <>
      {/* Strand — pinned at the start anchor; never moves. */}
      <group position={start}>
        <ParticleField
          positions={data.strand.positions}
          colors={data.strand.colors}
          sizes={data.strand.sizes}
        />
      </group>
      {/* Ball — rolls. Group transform updated each frame. */}
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
