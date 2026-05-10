'use client'

import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsFromAlpha } from '@/lib/particles'
import type { Animal } from '@/lib/types'

const PALETTES: Record<Animal, [number, number, number]> = {
  cat: [0.85, 0.7, 0.55], // 暖 sepia
  wolf: [0.55, 0.65, 0.78], // 冷蓝灰
  deer: [0.75, 0.8, 0.7], // sage 米灰
}

interface Props {
  animal: Animal
  count: number
  /** 角色相对 canvas 的位置 (Three.js NDC-like 单位，default 居中) */
  position?: [number, number, number]
  /** 缩放 */
  scale?: number
}

export function AnimalCharacter({ animal, count, position = [0, 0, 0], scale = 1 }: Props) {
  const [data, setData] = useState<{ positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null>(null)
  const groupRef = useRef<THREE.Group>(null!)

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
        // 微随机偏移，避免完全单色
        colors[i * 3] = r * (0.85 + Math.random() * 0.15)
        colors[i * 3 + 1] = g * (0.85 + Math.random() * 0.15)
        colors[i * 3 + 2] = b * (0.85 + Math.random() * 0.15)
        sizes[i] = 0.8 + Math.random() * 1.5
      }
      setData({ positions, colors, sizes })
    }
    img.src = `/assets/${animal}/char-sketch.png`
  }, [animal, count])

  // 慵懒呼吸：scale 微微 1 ↔ 1.005
  useFrame((state) => {
    if (!groupRef.current) return
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.003
    groupRef.current.scale.setScalar(scale * breathe)
  })

  if (!data) return null

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <ParticleField positions={data.positions} colors={data.colors} sizes={data.sizes} />
    </group>
  )
}
