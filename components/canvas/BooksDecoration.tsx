'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'

/**
 * Book stack decoration — particle-ized from the bg-removed books PNG,
 * with per-particle RGB sampled from the source so the stack reproduces
 * the original pencil-sketch look as a dot painting.
 *
 * Hover interaction (Step 2A · "page ruffle"):
 *   - Stack is static at rest.
 *   - On pointer enter, a single soft wave sweeps left → right across the
 *     "page region" (top portion of the stack — where the open book sits).
 *   - Each particle in the wave's band lifts vertically (sin envelope), so
 *     it looks like a breeze passing over the open pages. Below the page
 *     region, particles never move — the stack stays put.
 *   - One wave per hover-enter. Subsequent hover-enters during a running
 *     wave are ignored (no overlap); a fresh wave starts on the next
 *     hover-enter after the current one completes.
 */
interface Props {
  /** Centroid world position of the book pile. */
  position: [number, number, number]
  /** Multiplier applied to PNG-sampled NDC positions → world units. */
  scale?: number
  /** Particle count requested. */
  count?: number
  /** Wave traversal duration in seconds (single sweep, left → right). */
  waveDurationSec?: number
  /**
   * Fraction of the stack's height (from top) treated as "pages" and
   * reactive to the wave. 0..1. Default 0.3 = top 30%.
   */
  pageRegionFrac?: number
  /** Max vertical lift, as fraction of scale (world units). */
  liftFrac?: number
}

export function BooksDecoration({
  position,
  scale = 0.5,
  count = 12000,
  waveDurationSec = 1.4,
  pageRegionFrac = 0.3,
  liftFrac = 0.16,
}: Props) {
  const [data, setData] = useState<{
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } | null>(null)

  const groupRef = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points | null>(null)
  // Per-particle base (rest) position in local coords. Recomputed once at load.
  const baseX = useRef<Float32Array | null>(null)
  const baseY = useRef<Float32Array | null>(null)
  // When non-null, holds the elapsed-time snapshot at hover-enter; the
  // current wave is in flight.
  const hoverStartTime = useRef<number | null>(null)
  // Latest elapsed time, refreshed each frame. Read from event handlers
  // (which don't get a state.clock reference).
  const latestTime = useRef(0)

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[BooksDecoration] mounting, loading PNG')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // eslint-disable-next-line no-console
      console.log('[BooksDecoration] PNG loaded', img.width, 'x', img.height)
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const { positions, colors } = samplePositionsAndColorsFromAlpha(imageData, count, 1)
      const n = positions.length / 3
      for (let i = 0; i < positions.length; i++) positions[i] *= scale
      const sizes = new Float32Array(n)
      for (let i = 0; i < n; i++) sizes[i] = 0.55 + Math.random() * 0.5
      const bx = new Float32Array(n)
      const by = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        bx[i] = positions[i * 3]
        by[i] = positions[i * 3 + 1]
      }
      baseX.current = bx
      baseY.current = by
      setData({ positions, colors, sizes })
    }
    img.src = '/assets/cat/decorations/deco-cat-books.png'
  }, [count, scale])

  useEffect(() => {
    if (groupRef.current && data) {
      pointsRef.current = groupRef.current.children[0] as THREE.Points
    }
  }, [data])

  useFrame((state) => {
    latestTime.current = state.clock.elapsedTime
    if (!data || !baseX.current || !baseY.current) return

    // DEBUG: auto-trigger wave every cycle (no hover required) — so we can
    // see whether the animation runs regardless of hover detection.
    if (hoverStartTime.current === null) {
      hoverStartTime.current = state.clock.elapsedTime
    }

    // Compute wave progress; >= 1 means inactive.
    let waveProgress = 2
    if (hoverStartTime.current !== null) {
      const elapsed = state.clock.elapsedTime - hoverStartTime.current
      waveProgress = elapsed / waveDurationSec
      if (waveProgress >= 1.05) {
        hoverStartTime.current = null
        waveProgress = 2
      }
    }

    const positions = data.positions
    const n = positions.length / 3

    if (waveProgress >= 1) {
      // Wave done — restore particles to their base positions exactly once,
      // then early-return until the next wave.
      let dirty = false
      for (let i = 0; i < n; i++) {
        const px = baseX.current[i]
        const py = baseY.current[i]
        if (positions[i * 3 + 1] !== py || positions[i * 3] !== px) {
          positions[i * 3] = px
          positions[i * 3 + 1] = py
          dirty = true
        }
      }
      if (dirty && pointsRef.current?.geometry.attributes.position) {
        ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
          true
      }
      return
    }

    // Wave active. Wave front travels from local x = -scale (left/spine) to
    // +scale (right/page-edge) as progress goes 0 → 1.
    const waveFront = -scale + waveProgress * (2 * scale)
    const waveWidth = scale * 0.3
    // Local Y threshold above which particles are in the page region.
    // For pageRegionFrac=0.3, threshold = scale * (1 - 0.6) = 0.4*scale.
    const topThreshold = scale * (1 - 2 * pageRegionFrac)

    for (let i = 0; i < n; i++) {
      const px = baseX.current[i]
      const py = baseY.current[i]
      if (py < topThreshold) {
        positions[i * 3] = px
        positions[i * 3 + 1] = py
        continue
      }
      const dx = px - waveFront
      const absDx = Math.abs(dx)
      if (absDx < waveWidth) {
        const intensity = 1 - absDx / waveWidth
        const lift = Math.sin(intensity * Math.PI) * scale * liftFrac
        positions[i * 3] = px
        positions[i * 3 + 1] = py + lift
      } else {
        positions[i * 3] = px
        positions[i * 3 + 1] = py
      }
    }
    if (pointsRef.current?.geometry.attributes.position) {
      ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!data) return null

  const handleEnter = () => {
    // eslint-disable-next-line no-console
    console.log('[BooksDecoration] hover detected at', latestTime.current.toFixed(2))
    if (hoverStartTime.current === null) {
      hoverStartTime.current = latestTime.current
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
      {/* DEBUG: visible hover plane so the user can confirm where the hover
          target sits. Slightly larger than the particle cloud to give some
          hover tolerance. Both onPointerOver and onPointerEnter wired to
          rule out subtle event-firing differences. */}
      <mesh
        onPointerEnter={handleEnter}
        onPointerOver={handleEnter}
        position={[0, 0, 1]}
      >
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
