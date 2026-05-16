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
   * Fraction of the stack's height (from top) treated as the "page" and
   * flipped. 0..1, default 0.18 = top 18%.
   */
  pageRegionFrac?: number
}

export function BooksDecoration({
  position,
  scale = 0.5,
  count = 12000,
  flipDurationSec = 1.8,
  pageRegionFrac = 0.18,
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
  // Per page particle, r = baseX - spineX (≥ 0 since spine = leftmost X
  // of page particles). For non-page particles, r is 0 and unused.
  const pageR = useRef<Float32Array | null>(null)
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

      // Identify page particles = top pageRegionFrac of the stack's height.
      // Use percentile on baseY so it adapts to actual book bbox.
      const sortedY = Float32Array.from(by).sort()
      const cutoff = sortedY[Math.floor(n * (1 - pageRegionFrac))]
      let pageMinX = Infinity
      for (let i = 0; i < n; i++) {
        if (by[i] >= cutoff) {
          pageFlag[i] = 1
          if (bx[i] < pageMinX) pageMinX = bx[i]
        }
      }
      const localSpineX = pageMinX

      // Precompute r for each particle (only meaningful where pageFlag = 1).
      const r = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        if (pageFlag[i] === 1) r[i] = bx[i] - localSpineX
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

    let progress = 2
    if (hoverStartTime.current !== null) {
      const elapsed = state.clock.elapsedTime - hoverStartTime.current
      progress = elapsed / flipDurationSec
      if (progress >= 1.05) {
        hoverStartTime.current = null
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

    // θ goes 0 → π → 0 across the cycle (lift + return).
    const theta = Math.PI * Math.sin(progress * Math.PI)
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    const sX = spineX.current
    const flag = isPage.current
    const rArr = pageR.current

    for (let i = 0; i < n; i++) {
      if (flag[i] === 1) {
        const r = rArr[i]
        positions[i * 3] = sX + r * cosT
        positions[i * 3 + 1] = baseY.current[i]
        positions[i * 3 + 2] = r * sinT
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
