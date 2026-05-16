'use client'

import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  /** When false, canvas is positioned absolutely (for spike / standalone use). Default true (fixed full-viewport). */
  fixed?: boolean
  /**
   * When true, the canvas fills its positioned parent (100% / 100%) instead of
   * the viewport. Use this when the canvas lives inside a scene container that
   * locks bg + decorations + canvas to the bg's aspect ratio.
   */
  fillParent?: boolean
}

export function PersistentCanvas({ children, fixed = true, fillParent = false }: Props) {
  const useFixed = fixed && !fillParent
  return (
    <div
      style={{
        position: useFixed ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        width: fillParent ? '100%' : '100vw',
        height: fillParent ? '100%' : '100vh',
        zIndex: useFixed ? -1 : fillParent ? 2 : 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ pointerEvents: 'auto' }}
      >
        {children}
      </Canvas>
    </div>
  )
}
