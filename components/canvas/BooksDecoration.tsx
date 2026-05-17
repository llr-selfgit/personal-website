'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'
import { useSiteStore } from '@/lib/store'

/**
 * Book stack — particle reproduction of the bg-removed books PNG.
 *
 * Hover interaction: real page-flip. The top thin slice of particles
 * (the "page") rotates around the spine axis (the leftmost X of those
 * page particles) — every page particle traces a half-circle from its
 * rest position over the spine and back. Non-page particles (the lower
 * book stack) never move.
 *
 *   - θ(t) = π * sin(t · π), t ∈ [0, 1]: page lifts up, peaks vertical
 *     at t=0.5 (θ=π, flipped over), returns to rest at t=1 (θ=0).
 *   - Per page particle, distance r from spine = baseX - spineX.
 *     During rotation: position = (spineX + r·cos θ, baseY, r·sin θ).
 *     So the page rotates around the spine in the XZ plane while Y
 *     stays fixed (no vertical drift).
 *
 * Hover-enter triggers one flip cycle; subsequent enters during a
 * running flip are ignored.
 */

interface Props {
  position: [number, number, number]
  scale?: number
  count?: number
  /** Duration of one full flip cycle in seconds (lift + return). */
  flipDurationSec?: number
  /**
   * Fraction of the stack's height (from top) treated as the open-book
   * "page" region. The spine sits at the horizontal midpoint of this
   * region; only particles to the right of the spine flip. 0..1.
   */
  pageRegionFrac?: number
  /** Peak Y lift at θ=π/2, as fraction of scale. Adds visible elevation. */
  liftFrac?: number
  /**
   * Peak rotation angle as a fraction of π. 0.5 = page rises exactly to
   * vertical and falls back. 1.0 = full 180° flip-over. Default 0.55 — page
   * leans slightly past vertical (matching the user's reference photos)
   * before falling back, never completing the turn.
   */
  peakAngleFrac?: number
}

export function BooksDecoration({
  position,
  scale = 0.5,
  count = 12000,
  flipDurationSec = 1.8,
  pageRegionFrac = 0.4,
  liftFrac = 0.1,
  peakAngleFrac = 0.55,
}: Props) {
  const [data, setData] = useState<{
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } | null>(null)

  const groupRef = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points | null>(null)
  const baseX = useRef<Float32Array | null>(null)
  const baseY = useRef<Float32Array | null>(null)
  // Precomputed per particle: 1 if it's in the page region, 0 otherwise.
  const isPage = useRef<Uint8Array | null>(null)
  // Per page particle, r = baseX - spineX (> 0 since only right-of-spine
  // particles are flagged as page). For non-page particles, r is 0.
  const pageR = useRef<Float32Array | null>(null)
  // Spine is a vertical axis at the horizontal middle of the page region
  // (the binding of the open book). Right-half of the page rotates around
  // this axis in the XZ plane.
  const spineX = useRef<number>(0)
  const hoverStartTime = useRef<number | null>(null)
  const latestTime = useRef(0)

  // Hover signal from HTML overlay (CatDecorations). Increments each time
  // the cursor enters the books region. We trigger a flip on each new value.
  const bookHoverTrigger = useSiteStore((s) => s.bookHoverTrigger)
  const lastHandledTrigger = useRef<number>(0)
  useEffect(() => {
    if (bookHoverTrigger !== lastHandledTrigger.current) {
      lastHandledTrigger.current = bookHoverTrigger
      if (hoverStartTime.current === null) {
        hoverStartTime.current = latestTime.current
      }
    }
  }, [bookHoverTrigger])

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
      for (let i = 0; i < positions.length; i++) positions[i] *= scale
      const sizes = new Float32Array(n)
      for (let i = 0; i < n; i++) sizes[i] = 0.55 + Math.random() * 0.5

      const bx = new Float32Array(n)
      const by = new Float32Array(n)
      const pageFlag = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        bx[i] = positions[i * 3]
        by[i] = positions[i * 3 + 1]
      }

      // Identify the page region: top pageRegionFrac of particles by Y.
      // Compute the horizontal midpoint of these particles — that's the
      // binding (spine) of the open book. Then only flag particles to the
      // RIGHT of the spine for flipping; they swing up and over to the
      // left around the spine like a real page being turned.
      const sortedY = Float32Array.from(by).sort()
      const cutoff = sortedY[Math.floor(n * (1 - pageRegionFrac))]
      let pageMinX = Infinity
      let pageMaxX = -Infinity
      for (let i = 0; i < n; i++) {
        if (by[i] >= cutoff) {
          if (bx[i] < pageMinX) pageMinX = bx[i]
          if (bx[i] > pageMaxX) pageMaxX = bx[i]
        }
      }
      const localSpineX = (pageMinX + pageMaxX) / 2
      const r = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        if (by[i] >= cutoff && bx[i] > localSpineX) {
          pageFlag[i] = 1
          r[i] = bx[i] - localSpineX
        }
      }

      baseX.current = bx
      baseY.current = by
      isPage.current = pageFlag
      pageR.current = r
      spineX.current = localSpineX
      setData({ positions, colors, sizes })
    }
    img.src = '/assets/cat/decorations/deco-cat-books.png'
  }, [count, scale, pageRegionFrac])

  useEffect(() => {
    if (groupRef.current && data) {
      pointsRef.current = groupRef.current.children[0] as THREE.Points
    }
  }, [data])

  useFrame((state) => {
    latestTime.current = state.clock.elapsedTime
    if (
      !data ||
      !baseX.current ||
      !baseY.current ||
      !isPage.current ||
      !pageR.current
    )
      return

    // DEBUG: auto-trigger a flip on a loop (gap of 1.2s between flips) so we
    // can verify the animation runs regardless of hover detection.
    if (hoverStartTime.current === null) {
      hoverStartTime.current = state.clock.elapsedTime
    }

    let progress = 2
    if (hoverStartTime.current !== null) {
      const elapsed = state.clock.elapsedTime - hoverStartTime.current
      progress = elapsed / flipDurationSec
      if (progress >= 1.05) {
        // Hold a brief gap before next auto-trigger
        if (elapsed > flipDurationSec + 1.2) {
          hoverStartTime.current = null
        }
        progress = 2
      }
    }

    const positions = data.positions
    const n = positions.length / 3

    if (progress >= 1) {
      // Inactive — restore page particles to base.
      let dirty = false
      for (let i = 0; i < n; i++) {
        if (positions[i * 3 + 2] !== 0 || positions[i * 3] !== baseX.current[i]) {
          positions[i * 3] = baseX.current[i]
          positions[i * 3 + 1] = baseY.current[i]
          positions[i * 3 + 2] = 0
          dirty = true
        }
      }
      if (dirty && pointsRef.current?.geometry.attributes.position) {
        ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
          true
      }
      return
    }

    // θ goes 0 → peakAngleFrac·π → 0 across the cycle. Rotation in the XY
    // viewport plane around the spine line at X=spineX (each page particle
    // hinges at (spineX, baseY)):
    //   θ=0:        page flat to the right of spine (rest).
    //   θ=peakθ:    page leans up — peakAngleFrac controls how far. 0.5 = exactly
    //               vertical; 0.55 = slightly past vertical (matches reference);
    //               1.0 = full 180° flip-over.
    //   θ back to 0: page falls back to rest.
    // The page never completes a full flip — it lifts up, peaks, and falls
    // back down on the same side.
    // Z stays 0 — lift is in viewport Y, not depth-Z, so a top-down camera
    // sees the page rise visibly.
    const theta = peakAngleFrac * Math.PI * Math.sin(progress * Math.PI)
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    const sX = spineX.current
    const flag = isPage.current
    const rArr = pageR.current

    for (let i = 0; i < n; i++) {
      if (flag[i] === 1) {
        const r = rArr[i]
        positions[i * 3] = sX + r * cosT
        positions[i * 3 + 1] = baseY.current[i] + r * sinT
        positions[i * 3 + 2] = 0
      } else {
        positions[i * 3] = baseX.current[i]
        positions[i * 3 + 1] = baseY.current[i]
        positions[i * 3 + 2] = 0
      }
    }
    if (pointsRef.current?.geometry.attributes.position) {
      ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef} position={position}>
      <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
    </group>
  )
}
