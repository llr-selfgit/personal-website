'use client'

import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsFromAlpha } from '@/lib/particles'
import { RippleManager, computeRippleForce, DEFAULT_RIPPLE_PARAMS } from '@/lib/ripple'
import type { Animal } from '@/lib/types'

// NDC-scaled ripple (canvas 视口高约 5 NDC 单位)
const RIPPLE_NDC = {
  ...DEFAULT_RIPPLE_PARAMS,
  speed: 0.6,        // 220 px/s 在 ~viewport 高 900px → 0.5-0.7 NDC/s
  maxRadius: 0.35,   // 130px → ~0.3-0.4 NDC
  bandThickness: 0.06,
  pushStrength: 0.06,
}

const PALETTES: Record<Animal, [number, number, number]> = {
  cat: [1.0, 0.85, 0.68],   // 明亮暖琥珀（之前太暗）
  wolf: [0.65, 0.78, 0.95], // 明亮冷蓝
  deer: [0.92, 0.92, 0.85], // 明亮米白
}

interface Props {
  animal: Animal
  count: number
  position?: [number, number, number]
  scale?: number
}

export function AnimalCharacter({ animal, count, position = [0, 0, 0], scale = 1 }: Props) {
  const [data, setData] = useState<{ positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null>(null)
  const groupRef = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points | null>(null)
  const velocities = useRef<Float32Array | null>(null)
  const origins = useRef<Float32Array | null>(null)
  const ripples = useRef(new RippleManager(RIPPLE_NDC))

  // 加载 char-sketch → 采样位置 + 着色
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
      const [r, g, b] = PALETTES[animal]
      for (let i = 0; i < n; i++) {
        // 微随机化亮度 + 色相，避免完全单色
        const jitter = 0.85 + Math.random() * 0.15
        colors[i * 3] = Math.min(1, r * jitter)
        colors[i * 3 + 1] = Math.min(1, g * jitter)
        colors[i * 3 + 2] = Math.min(1, b * jitter)
        sizes[i] = 1.0 + Math.random() * 1.8
      }
      origins.current = new Float32Array(positions)
      velocities.current = new Float32Array(positions.length)
      setData({ positions, colors, sizes })
    }
    img.src = `/assets/${animal}/char-sketch.png`
  }, [animal, count])

  // 鼠标 ripple 触发器（global pointermove，转换为 local NDC）
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      // 减去 group 位置（粗略，scale 假设 1）
      const localX = x - position[0]
      const localY = y - position[1]
      ripples.current.spawn(localX, localY, performance.now())
    }
    window.addEventListener('pointermove', handler)
    return () => window.removeEventListener('pointermove', handler)
  }, [position])

  // 抓 points ref（ParticleField 内部的 mesh）
  useEffect(() => {
    if (groupRef.current) {
      pointsRef.current = groupRef.current.children[0] as THREE.Points
    }
  }, [data])

  useFrame((state) => {
    if (!groupRef.current || !data || !velocities.current || !origins.current) return
    const t = state.clock.elapsedTime

    // 呼吸：明显但不浮夸（1.5% 缩放）
    const breathe = 1 + Math.sin(t * 0.45) * 0.015
    groupRef.current.scale.setScalar(scale * breathe)

    // ripple 物理
    const now = performance.now()
    ripples.current.tick(now)
    const active = ripples.current.getRipples()

    if (active.length === 0 && velocities.current.every((v) => Math.abs(v) < 1e-5)) {
      return // 无 ripple、无残余 velocity 时跳过 update
    }

    const SPRING = 0.06
    const DAMP = 0.85
    const positions = data.positions

    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i]
      const py = positions[i + 1]
      const ox = origins.current[i]
      const oy = origins.current[i + 1]
      let fx = 0
      let fy = 0
      for (let k = 0; k < active.length; k++) {
        const force = computeRippleForce({
          particleX: px,
          particleY: py,
          ripple: active[k],
          currentTime: now,
          params: RIPPLE_NDC,
        })
        fx += force.x
        fy += force.y
      }
      fx += (ox - px) * SPRING
      fy += (oy - py) * SPRING
      velocities.current[i] = velocities.current[i] * DAMP + fx
      velocities.current[i + 1] = velocities.current[i + 1] * DAMP + fy
      positions[i] += velocities.current[i]
      positions[i + 1] += velocities.current[i + 1]
    }

    if (pointsRef.current?.geometry.attributes.position) {
      ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
    </group>
  )
}
