'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ParticleField } from './ParticleField'
import {
  samplePositionsAndColorsFromAlpha,
  samplePositionsAndColorsFromMask,
} from '@/lib/particles'
import { useSiteStore } from '@/lib/store'

/**
 * Books decoration — stack stays put, only the page animates.
 *
 * The 4 hand-drawn sprite frames are each AI-generated, so even when the
 * user intends "only the page changes", every regeneration shifts the book
 * stack's angle / shading subtly. To make the animation feel like only the
 * page is moving, we partition pixels:
 *
 *   - STABLE region: pixels that are opaque in ≥3 of the 4 frames. This is
 *     the bottom stack (and the unchanged left half of the open book).
 *     Sampled ONCE from frame 0 and rendered as a fixed particle cloud at
 *     full opacity throughout the animation.
 *
 *   - PAGE regions (per frame): pixels opaque in that frame but NOT in the
 *     stable set. The page in each frame moves, so different pixels light
 *     up. 4 small clouds, each sampled from its frame's page mask.
 *     Crossfaded during the flip animation; the stable layer never blinks.
 *
 * Net effect: a single visually-consistent stack with a page-only animation.
 */

interface Props {
  position: [number, number, number]
  scale?: number
  /** Particle count for the stable (stack) layer. */
  stackCount?: number
  /** Particle count for each per-frame page layer. */
  pageCount?: number
  flipDurationSec?: number
}

interface FrameData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

const NUM_FRAMES = 4
const PEAK_HOLD_FRAC = 0.1
const ALPHA_THRESHOLD = 30
// Sum of |Δr|+|Δg|+|Δb| above this between frame 0 and any other frame at
// the same pixel marks the pixel as "page" (changing content), even if all
// 4 frames have alpha there. Tune higher to be more tolerant of AI render
// noise; tune lower to push more pixels into the page layer.
const RGB_DIFF_THRESHOLD = 50

async function loadImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, img.width, img.height))
    }
    img.onerror = reject
    img.src = src
  })
}

function buildFrameData(
  positions: Float32Array,
  colors: Float32Array,
  scale: number,
  sizeJitter = 0.45,
): FrameData {
  for (let i = 0; i < positions.length; i++) positions[i] *= scale
  const n = positions.length / 3
  const sizes = new Float32Array(n)
  for (let i = 0; i < n; i++) sizes[i] = 0.55 + Math.random() * sizeJitter
  return { positions, colors, sizes }
}

export function BooksFrames({
  position,
  scale = 0.55,
  stackCount = 8000,
  pageCount = 1800,
  flipDurationSec = 1.8,
}: Props) {
  const [data, setData] = useState<{
    stack: FrameData
    pages: FrameData[]
  } | null>(null)
  const [opacities, setOpacities] = useState<number[]>(() => {
    const init = new Array(NUM_FRAMES).fill(0)
    init[0] = 1
    return init
  })
  const bookHoverTrigger = useSiteStore((s) => s.bookHoverTrigger)
  const lastHandled = useRef(0)
  const animStart = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      Array.from({ length: NUM_FRAMES }, (_, i) =>
        loadImageData(`/assets/cat/decorations/books-frame-${i}.png`),
      ),
    ).then((frames) => {
      if (cancelled) return
      const w = frames[0].width
      const h = frames[0].height
      const pixelCount = w * h

      // Build masks. A pixel is "stable" only if (a) all 4 frames are opaque
      // AND (b) their RGB content is consistent (sum-of-abs-diffs between
      // frame 0 and each other frame ≤ RGB_DIFF_THRESHOLD). Pixels that
      // differ in alpha OR color across frames → page layer in whichever
      // frames have alpha there.
      const stableMask = new Uint8Array(pixelCount)
      const pageMasks = Array.from({ length: NUM_FRAMES }, () => new Uint8Array(pixelCount))

      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4
        const opaque = [false, false, false, false]
        let opaqueCount = 0
        for (let f = 0; f < NUM_FRAMES; f++) {
          if (frames[f].data[idx + 3] > ALPHA_THRESHOLD) {
            opaque[f] = true
            opaqueCount++
          }
        }

        let isStable = false
        if (opaqueCount === NUM_FRAMES) {
          // All 4 opaque — compare RGB to frame 0.
          const r0 = frames[0].data[idx]
          const g0 = frames[0].data[idx + 1]
          const b0 = frames[0].data[idx + 2]
          let maxDiff = 0
          for (let f = 1; f < NUM_FRAMES; f++) {
            const diff =
              Math.abs(frames[f].data[idx] - r0) +
              Math.abs(frames[f].data[idx + 1] - g0) +
              Math.abs(frames[f].data[idx + 2] - b0)
            if (diff > maxDiff) maxDiff = diff
          }
          if (maxDiff <= RGB_DIFF_THRESHOLD) isStable = true
        }

        if (isStable) {
          stableMask[i] = 1
        } else {
          for (let f = 0; f < NUM_FRAMES; f++) {
            if (opaque[f]) pageMasks[f][i] = 1
          }
        }
      }

      // Sample stable layer from frame 0 (its colors define the consistent
      // stack look).
      const stableRaw = samplePositionsAndColorsFromMask(
        frames[0],
        stableMask,
        stackCount,
        1,
      )
      const stack = buildFrameData(stableRaw.positions, stableRaw.colors, scale)

      // Sample page layer for each frame using its own mask + own colors.
      const pages = pageMasks.map((mask, i) => {
        // Use unmasked sampler when a page mask happens to be empty (defensive).
        const raw =
          mask.some((v) => v)
            ? samplePositionsAndColorsFromMask(frames[i], mask, pageCount, 1)
            : samplePositionsAndColorsFromAlpha(frames[i], 1, 1)
        return buildFrameData(raw.positions, raw.colors, scale, 0.35)
      })

      setData({ stack, pages })
    })
    return () => {
      cancelled = true
    }
  }, [stackCount, pageCount, scale])

  useEffect(() => {
    if (bookHoverTrigger === lastHandled.current) return
    lastHandled.current = bookHoverTrigger
    if (animStart.current === null) animStart.current = performance.now()
  }, [bookHoverTrigger])

  useFrame(() => {
    if (animStart.current === null) return
    const elapsed = (performance.now() - animStart.current) / 1000
    const progress = elapsed / flipDurationSec
    if (progress >= 1) {
      animStart.current = null
      const rest = new Array(NUM_FRAMES).fill(0)
      rest[0] = 1
      setOpacities(rest)
      return
    }
    const maxFrame = NUM_FRAMES - 1
    const rampWidth = 0.5 - PEAK_HOLD_FRAC / 2
    let frameValue: number
    if (progress < rampWidth) {
      frameValue = (progress / rampWidth) * maxFrame
    } else if (progress < 1 - rampWidth) {
      frameValue = maxFrame
    } else {
      frameValue = ((1 - progress) / rampWidth) * maxFrame
    }
    const frameLow = Math.floor(frameValue)
    const frac = frameValue - frameLow
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * frac)
    const ops = new Array(NUM_FRAMES).fill(0)
    if (frameLow >= maxFrame) ops[maxFrame] = 1
    else {
      ops[frameLow] = 1 - eased
      ops[frameLow + 1] = eased
    }
    setOpacities(ops)
  })

  if (!data) return null

  return (
    <group position={position}>
      {/* Stable stack — always full opacity, never blinks. */}
      <ParticleField
        positions={data.stack.positions}
        colors={data.stack.colors}
        sizes={data.stack.sizes}
        introAlpha={1}
      />
      {/* Page layers — only this part crossfades between frames. */}
      {data.pages.map((p, i) => (
        <ParticleField
          key={i}
          positions={p.positions}
          colors={p.colors}
          sizes={p.sizes}
          introAlpha={opacities[i]}
        />
      ))}
    </group>
  )
}
