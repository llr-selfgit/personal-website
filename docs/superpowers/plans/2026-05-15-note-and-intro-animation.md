# Hub Note Tag + Quote Rotation + Intro Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land hub revamp — left note tag (hover-expand bio), main-area literary quote rotation, and ink-wash intro animation — on top of the existing cat hub. Also fixes three pre-existing bugs that block visual validation.

**Architecture:**
- Pure additive on top of existing `AnimalCharacter` + `ParticleField` + `HubScene` (no canvas rewrite). Intro animation reuses existing origin/positions buffers; introduces one `uIntroAlpha` shader uniform and one `useIntroAnimation` React hook that exposes `{ particleProgress, particleAlpha, textAlpha }`.
- D path (entry-triptych continuation) is scaffolded via a Zustand `introState` slice but not wired (entry triptych is Task 18 of the master plan). When `introState === null`, fallback to C path (origin + Gaussian jitter, lerp back).
- Per-animal duration map keeps the parameter surface inside `useIntroAnimation`.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript · React Three Fiber · Three.js · Zustand 5 · Vitest · framer-motion (already installed).

**Spec:** `docs/superpowers/specs/2026-05-15-note-and-intro-animation-design.md`

---

## File Structure

**New:**
- `content/cat/quotes.json` — 5 cat quotes (placeholders, content filled by user)
- `lib/intro-animation.ts` — easing functions, per-animal config, `useIntroAnimation` hook
- `lib/__tests__/intro-animation.test.ts` — unit tests
- `components/ui/NoteTag.tsx` — hover-expand bio component (all three animal palettes)
- `components/ui/QuoteHero.tsx` — quote + author display
- `components/__tests__/NoteTag.test.tsx`
- `components/__tests__/QuoteHero.test.tsx`

**Modified:**
- `lib/ripple.ts` — fix `dist < 1` → `dist < 1e-4`
- `lib/store.ts` — add `introState` slice + `skipIntro` helpers
- `components/canvas/AnimalCharacter.tsx` — bump breathing freq; integrate `useIntroAnimation`
- `components/canvas/ParticleField.tsx` — add `introAlpha` prop forwarded to shader
- `components/canvas/shaders/particle.vert.glsl` — add `uIntroAlpha` uniform
- `components/canvas/shaders/particle.frag.glsl` — multiply alpha by `uIntroAlpha`
- `components/canvas/scenes/HubScene.tsx` — adjust cat Y position to `-1.7`
- `app/cat/page.tsx` — drop hero text + about.mdx body; mount `<NoteTag>` + `<QuoteHero>`; wire `textAlpha`
- `app/cat/essays/page.tsx`, `app/cat/toys/page.tsx` — set `skipIntro` flag on navigate-back (or trigger from Link)

**Removed (or repurposed):**
- `content/cat/about.mdx` — content moves into NoteTag hover (kept as TS constant in `content/cat/bio.ts`)

---

## Task 1: Pre-flight bug fixes (ripple, breathing, cat position)

**Files:**
- Modify: `lib/ripple.ts:46-47`
- Modify: `components/canvas/AnimalCharacter.tsx:117`
- Modify: `components/canvas/scenes/HubScene.tsx:25`
- Test: `lib/__tests__/ripple.test.ts` (add regression test)

- [ ] **Step 1: Write failing regression test for ripple world-units**

Add to `lib/__tests__/ripple.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeRippleForce } from '../ripple'

describe('computeRippleForce — world units (small distances)', () => {
  it('returns non-zero force when particle is 0.05 from ripple center (world units)', () => {
    const force = computeRippleForce({
      particleX: 0.05,
      particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 100, // 0.1s after spawn
      params: {
        speed: 0.8,
        maxRadius: 0.6,
        bandThickness: 0.08,
        pushStrength: 0.12,
        spawnInterval: 130,
        maxConcurrent: 4,
      },
    })
    // ringR at t=0.1s with speed=0.8 is 0.08. dist=0.05. offset=0.03 < bandThickness 0.08 → in band → non-zero
    expect(Math.abs(force.x)).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
bunx vitest run lib/__tests__/ripple.test.ts -t "world units"
```

Expected: FAIL — force.x is 0 because current `dist < 1` returns early.

- [ ] **Step 3: Fix ripple guard threshold**

Edit `lib/ripple.ts`, change line ~46:

```typescript
// Before
if (dist < 1) return { x: 0, y: 0 }
// After
if (dist < 1e-4) return { x: 0, y: 0 }
```

- [ ] **Step 4: Run test to verify it passes**

```
bunx vitest run lib/__tests__/ripple.test.ts
```

Expected: all pass (including existing pixel-unit tests since 1e-4 < 1 px).

- [ ] **Step 5: Bump breathing frequency in AnimalCharacter**

Edit `components/canvas/AnimalCharacter.tsx`, find:

```typescript
const breathe = 1 + Math.sin(t * 0.5) * 0.03
```

Change to:

```typescript
const breathe = 1 + Math.sin(t * 1.8) * 0.03
```

Frequency 1.8 rad/s → period ≈ 3.5s (natural slow breath).

- [ ] **Step 6: Lower cat position to sit on rug**

Edit `components/canvas/scenes/HubScene.tsx`, find:

```typescript
position={animal === 'cat' ? [1.0, -1.1, 0] : animal === 'wolf' ? [1.5, 0.3, 0] : [1.6, -0.2, 0]}
```

Change cat tuple to `[1.0, -1.7, 0]`:

```typescript
position={animal === 'cat' ? [1.0, -1.7, 0] : animal === 'wolf' ? [1.5, 0.3, 0] : [1.6, -0.2, 0]}
```

- [ ] **Step 7: Commit**

```bash
git add lib/ripple.ts lib/__tests__/ripple.test.ts components/canvas/AnimalCharacter.tsx components/canvas/scenes/HubScene.tsx
git commit -m "fix(cat-hub): world-unit ripple guard + breathing tempo + cat on rug"
```

- [ ] **Step 8: Manual verify on dev server**

```
bun run dev
```

Open `http://localhost:3000/cat`. Verify:
- Cat sits on the rug area (lower than before)
- Breathing visible (scale wobble every ~3.5s)
- Mouse hover near cat → particles push/return (concentric ripple)

If any of the three still fails, stop and investigate before continuing. **Do not** push yet — bundle with Task 2+.

---

## Task 2: Cat bio constant + NoteTag component skeleton

**Files:**
- Create: `content/cat/bio.ts`
- Create: `components/ui/NoteTag.tsx`
- Create: `components/__tests__/NoteTag.test.tsx`
- Delete: `content/cat/about.mdx` (last step)

- [ ] **Step 1: Create cat bio constant**

Create `content/cat/bio.ts`:

```typescript
export const catBio = {
  name: 'llr · ireneegofly',
  tagline: 'a corner for AI tinkering',
  role: '在 anthropic 做 dev tools',
  body: [
    '我在做一些和 AI 有关的小事。',
    '有时候是工具，有时候是想法，',
    '更多时候是把没想清楚的东西写下来——',
    '等它自己长出来。',
  ],
  location: '2026 春 · 上海',
  links: [
    { label: 'email', href: 'mailto:luolingrui1008@gmail.com' },
    { label: 'github', href: 'https://github.com/llr-selfgit' },
  ],
}

export type Bio = typeof catBio
```

- [ ] **Step 2: Write failing test for NoteTag default render**

Create `components/__tests__/NoteTag.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteTag } from '../ui/NoteTag'
import { catBio } from '@/content/cat/bio'

describe('NoteTag', () => {
  it('renders tagline by default', () => {
    render(<NoteTag animal="cat" bio={catBio} textAlpha={1} />)
    expect(screen.getByText(catBio.name)).toBeInTheDocument()
    expect(screen.getByText(catBio.tagline)).toBeInTheDocument()
    expect(screen.getByText(/hover to read more/i)).toBeInTheDocument()
  })

  it('hides expanded bio body until hover/focus', () => {
    render(<NoteTag animal="cat" bio={catBio} textAlpha={1} />)
    expect(screen.queryByText(catBio.body[0])).not.toBeVisible()
  })
})
```

- [ ] **Step 3: Check that @testing-library/react is installed**

```
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Update `vitest.config.ts` if jsdom env not yet set:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Run test to verify failure (NoteTag not defined)**

```
bunx vitest run components/__tests__/NoteTag.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 5: Implement NoteTag**

Create `components/ui/NoteTag.tsx`:

```typescript
'use client'

import { useState } from 'react'
import type { Animal } from '@/lib/types'
import type { Bio } from '@/content/cat/bio'

const PALETTES: Record<Animal, { paper: string; ink: string; accent: string }> = {
  cat:  { paper: '#f4e6c8', ink: '#3a2818', accent: '#b89868' },
  wolf: { paper: '#d8dde4', ink: '#1c2530', accent: '#7a8b9c' },
  deer: { paper: '#ece8dd', ink: '#403828', accent: '#a8957a' },
}

interface Props {
  animal: Animal
  bio: Bio
  textAlpha: number
}

export function NoteTag({ animal, bio, textAlpha }: Props) {
  const [open, setOpen] = useState(false)
  const palette = PALETTES[animal]

  return (
    <div
      style={{
        position: 'fixed',
        left: '32px',
        top: '100px',
        opacity: textAlpha,
        zIndex: 30,
        pointerEvents: textAlpha > 0.5 ? 'auto' : 'none',
        transition: 'opacity 250ms ease-out',
      }}
    >
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-label={`关于 ${bio.name}`}
        style={{
          width: '180px',
          background: palette.paper,
          color: palette.ink,
          padding: '14px 12px',
          transform: 'rotate(-3deg)',
          boxShadow: '4px 6px 12px rgba(0,0,0,0.5)',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: 1.55,
        }}
      >
        <div style={{ fontSize: '11px', letterSpacing: '0.08em', opacity: 0.55, marginBottom: '4px' }}>— note —</div>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{bio.name.split(' · ')[0]}</div>
        <div style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic', marginTop: '4px' }}>{bio.tagline}</div>
        <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '6px' }}>hover to read more →</div>
      </button>

      <div
        role="region"
        aria-hidden={!open}
        style={{
          position: 'absolute',
          left: '180px',
          top: 0,
          width: '280px',
          background: palette.paper,
          color: palette.ink,
          padding: '18px 16px',
          marginLeft: '8px',
          transform: open ? 'translateX(0) rotate(-1deg)' : 'translateX(-10px) rotate(-3deg)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'transform 250ms ease-out, opacity 250ms ease-out, visibility 0s linear ' + (open ? '0s' : '250ms'),
          boxShadow: '6px 10px 20px rgba(0,0,0,0.6)',
          fontSize: '13px',
          lineHeight: 1.65,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 700 }}>{bio.name}</div>
        <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '6px', opacity: 0.85 }}>{bio.role}</div>
        <div style={{ marginTop: '12px' }}>
          {bio.body.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div style={{ fontSize: '11px', marginTop: '14px', opacity: 0.55 }}>{bio.location}</div>
        <div style={{ fontSize: '11px', marginTop: '6px' }}>
          {bio.links.map((l, i) => (
            <span key={l.label}>
              {i > 0 && ' · '}
              <a href={l.href} style={{ color: palette.accent, textDecoration: 'none', borderBottom: `1px solid ${palette.accent}` }}>
                {l.label}
              </a>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify pass**

```
bunx vitest run components/__tests__/NoteTag.test.tsx
```

Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
git add content/cat/bio.ts components/ui/NoteTag.tsx components/__tests__/NoteTag.test.tsx vitest.config.ts vitest.setup.ts package.json
git commit -m "feat(ui): NoteTag component with hover-expand bio"
```

---

## Task 3: Cat quotes data + QuoteHero component

**Files:**
- Create: `content/cat/quotes.json`
- Create: `components/ui/QuoteHero.tsx`
- Create: `components/__tests__/QuoteHero.test.tsx`

- [ ] **Step 1: Create quotes.json with 5 placeholder quotes**

Create `content/cat/quotes.json`:

```json
[
  {
    "text": "吾辈是猫。名字尚无。",
    "author": "夏目漱石",
    "work": "《我是猫》",
    "translator": "刘振瀛"
  },
  {
    "text": "它要是高兴，能比谁都温柔可亲。",
    "author": "老舍",
    "work": "《猫》"
  },
  {
    "text": "我的爱与厌都不能成纯。",
    "author": "周作人",
    "work": "《雨天的书》"
  },
  {
    "text": "在镜中，另一只虎。",
    "author": "博尔赫斯",
    "work": "《老虎的金黄》",
    "translator": "王央乐"
  },
  {
    "text": "它能听见你听不见的声音。",
    "author": "张爱玲",
    "work": "《华丽缘》"
  }
]
```

These are placeholder引文 — user can replace with verified quotes later.

- [ ] **Step 2: Write failing test for QuoteHero**

Create `components/__tests__/QuoteHero.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteHero } from '../ui/QuoteHero'
import quotes from '@/content/cat/quotes.json'

describe('QuoteHero', () => {
  beforeEach(() => {
    // pin Math.random to first quote
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('renders selected quote text', () => {
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(quotes[0].text)).toBeInTheDocument()
  })

  it('renders signature with author and work', () => {
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(new RegExp(quotes[0].author))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(quotes[0].work))).toBeInTheDocument()
  })

  it('includes translator when present', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(/刘振瀛/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify failure**

```
bunx vitest run components/__tests__/QuoteHero.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement QuoteHero**

Create `components/ui/QuoteHero.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { Animal } from '@/lib/types'

export interface Quote {
  text: string
  author: string
  work: string
  translator?: string
}

interface Props {
  animal: Animal
  quotes: Quote[]
  textAlpha: number
}

export function QuoteHero({ animal, quotes, textAlpha }: Props) {
  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * quotes.length))

  // Re-pick on remount (e.g. via route revisit); index is already random on first render
  useEffect(() => {
    setIndex(Math.floor(Math.random() * quotes.length))
  }, [quotes])

  const q = quotes[index]

  return (
    <section style={{ opacity: textAlpha, transition: 'opacity 350ms ease-out', maxWidth: '36rem' }} className="px-8 pt-40 pb-32">
      <blockquote
        className={animal === 'wolf' ? 'font-wolf-en' : 'font-cat-zh'}
        style={{
          fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
          lineHeight: 1.55,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          color: '#e6d3a3',
        }}
      >
        {q.text}
      </blockquote>
      <div
        style={{
          marginTop: '18px',
          textAlign: 'right',
          fontSize: '13px',
          opacity: 0.6,
          fontStyle: 'italic',
          color: '#c9a577',
        }}
      >
        — {q.author} · {q.work}
        {q.translator && <span style={{ opacity: 0.55 }}>（{q.translator} 译）</span>}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify pass**

```
bunx vitest run components/__tests__/QuoteHero.test.tsx
```

Expected: all 3 PASS.

- [ ] **Step 6: Commit**

```bash
git add content/cat/quotes.json components/ui/QuoteHero.tsx components/__tests__/QuoteHero.test.tsx
git commit -m "feat(ui): QuoteHero with cat literary quote rotation"
```

---

## Task 4: useIntroAnimation hook + per-animal config

**Files:**
- Create: `lib/intro-animation.ts`
- Create: `lib/__tests__/intro-animation.test.ts`

- [ ] **Step 1: Write failing test for easing + alpha curves**

Create `lib/__tests__/intro-animation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { easeOutQuart, computeAlpha, INTRO_DURATIONS } from '../intro-animation'

describe('easeOutQuart', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutQuart(0)).toBe(0)
  })
  it('returns 1 at t=1', () => {
    expect(easeOutQuart(1)).toBe(1)
  })
  it('is monotonic', () => {
    expect(easeOutQuart(0.5)).toBeGreaterThan(easeOutQuart(0.25))
    expect(easeOutQuart(0.75)).toBeGreaterThan(easeOutQuart(0.5))
  })
  it('decelerates (more progress early)', () => {
    expect(easeOutQuart(0.5)).toBeGreaterThan(0.5) // ease-out: past midpoint quickly
  })
})

describe('INTRO_DURATIONS', () => {
  it('cat 1.8s, wolf 1.2s, deer 2.0s', () => {
    expect(INTRO_DURATIONS.cat).toBe(1.8)
    expect(INTRO_DURATIONS.wolf).toBe(1.2)
    expect(INTRO_DURATIONS.deer).toBe(2.0)
  })
})

describe('computeAlpha', () => {
  const duration = 1.6
  const fadeStart = 0.3

  it('particle alpha is 0.15 before fade starts', () => {
    expect(computeAlpha({ elapsed: 0, duration, fadeStart, target: 'particle' })).toBeCloseTo(0.15)
    expect(computeAlpha({ elapsed: 0.2, duration, fadeStart, target: 'particle' })).toBeCloseTo(0.15)
  })
  it('particle alpha at end = 1', () => {
    expect(computeAlpha({ elapsed: duration, duration, fadeStart, target: 'particle' })).toBeCloseTo(1)
  })
  it('text alpha is 0 before fadeStart', () => {
    expect(computeAlpha({ elapsed: 0.2, duration, fadeStart, target: 'text' })).toBe(0)
  })
  it('text alpha at end = 1', () => {
    expect(computeAlpha({ elapsed: duration, duration, fadeStart, target: 'text' })).toBeCloseTo(1)
  })
})
```

- [ ] **Step 2: Run test — verify failure**

```
bunx vitest run lib/__tests__/intro-animation.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement intro-animation module**

Create `lib/intro-animation.ts`:

```typescript
import { useEffect, useRef, useState } from 'react'
import type { Animal } from './types'

export const INTRO_DURATIONS: Record<Animal, number> = {
  cat: 1.8,
  wolf: 1.2,
  deer: 2.0,
}

/** σ (世界单位) for ink-wash fallback jitter */
export const INTRO_SIGMA = 0.6

/** Text fade lags particle motion by this many seconds */
export const INTRO_FADE_START = 0.3

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

interface ComputeAlphaInput {
  elapsed: number
  duration: number
  fadeStart: number
  target: 'particle' | 'text'
}

export function computeAlpha({ elapsed, duration, fadeStart, target }: ComputeAlphaInput): number {
  if (elapsed >= duration) return 1
  if (target === 'particle') {
    if (elapsed < fadeStart) return 0.15
    const u = (elapsed - fadeStart) / (duration - fadeStart)
    return 0.15 + (1 - 0.15) * easeOutQuart(u)
  } else {
    if (elapsed < fadeStart) return 0
    return (elapsed - fadeStart) / (duration - fadeStart)
  }
}

export interface IntroState {
  /** progress 0..1 — driving particle position lerp */
  particleProgress: number
  /** alpha 0.15..1 — shader uniform */
  particleAlpha: number
  /** alpha 0..1 — text opacity */
  textAlpha: number
  /** true once animation completed */
  done: boolean
}

interface UseIntroAnimationInput {
  animal: Animal
  /** when true (sub-page return, reduce-motion), skip animation */
  skip: boolean
}

/**
 * Drives intro animation timeline. Returns alpha values and progress on every animation frame.
 * Triggers once on mount unless skip=true.
 */
export function useIntroAnimation({ animal, skip }: UseIntroAnimationInput): IntroState {
  const duration = INTRO_DURATIONS[animal]
  const start = useRef<number | null>(null)
  const [state, setState] = useState<IntroState>(() =>
    skip
      ? { particleProgress: 1, particleAlpha: 1, textAlpha: 1, done: true }
      : { particleProgress: 0, particleAlpha: 0.15, textAlpha: 0, done: false }
  )

  useEffect(() => {
    if (skip) return
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const elapsed = (now - start.current) / 1000
      const u = Math.min(1, elapsed / duration)
      const particleProgress = easeOutQuart(u)
      const particleAlpha = computeAlpha({ elapsed, duration, fadeStart: INTRO_FADE_START, target: 'particle' })
      const textAlpha = computeAlpha({ elapsed, duration, fadeStart: INTRO_FADE_START, target: 'text' })
      const done = elapsed >= duration
      setState({ particleProgress, particleAlpha, textAlpha, done })
      if (!done) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animal, skip, duration])

  return state
}
```

- [ ] **Step 4: Run tests — verify pass**

```
bunx vitest run lib/__tests__/intro-animation.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/intro-animation.ts lib/__tests__/intro-animation.test.ts
git commit -m "feat(lib): useIntroAnimation hook with per-animal duration + ease-out-quart"
```

---

## Task 5: Shader uniform for intro alpha

**Files:**
- Modify: `components/canvas/shaders/particle.vert.glsl`
- Modify: `components/canvas/shaders/particle.frag.glsl`
- Modify: `components/canvas/ParticleField.tsx`

- [ ] **Step 1: Read existing vert shader**

```
cat components/canvas/shaders/particle.vert.glsl
```

Note the current uniforms (`uTime`, `uPixelRatio`).

- [ ] **Step 2: Add uIntroAlpha to vertex shader**

Edit `components/canvas/shaders/particle.vert.glsl`. After existing uniform declarations, add:

```glsl
uniform float uIntroAlpha;
varying float vIntroAlpha;
```

Inside `void main()`, add at the end:

```glsl
vIntroAlpha = uIntroAlpha;
```

(Pass it through to fragment via varying.)

- [ ] **Step 3: Apply uIntroAlpha in fragment shader**

Edit `components/canvas/shaders/particle.frag.glsl`. Add at the top:

```glsl
varying float vIntroAlpha;
```

In `void main()`, find the final `gl_FragColor = vec4(color, alpha);` (or equivalent) line and multiply alpha:

```glsl
gl_FragColor = vec4(color, alpha * vIntroAlpha);
```

- [ ] **Step 4: Pass introAlpha through ParticleField**

Edit `components/canvas/ParticleField.tsx`:

In `interface Props`, add:

```typescript
introAlpha?: number
```

In the material `useMemo`, add `uIntroAlpha` uniform:

```typescript
uniforms: {
  uTime: { value: 0 },
  uPixelRatio: { value: pixelRatio },
  uIntroAlpha: { value: 1 },
},
```

In `useFrame`, update the uniform:

```typescript
material.uniforms.uTime.value = state.clock.elapsedTime
material.uniforms.uIntroAlpha.value = introAlpha ?? 1
```

- [ ] **Step 5: Manual sanity — verify still renders**

```
bun run dev
```

Open `http://localhost:3000/cat`. Cat should still render at full alpha (default `introAlpha = 1`). No regression.

- [ ] **Step 6: Commit**

```bash
git add components/canvas/shaders/particle.vert.glsl components/canvas/shaders/particle.frag.glsl components/canvas/ParticleField.tsx
git commit -m "feat(canvas): uIntroAlpha shader uniform for fade-in"
```

---

## Task 6: AnimalCharacter intro integration

**Files:**
- Modify: `components/canvas/AnimalCharacter.tsx`

- [ ] **Step 1: Add intro animation imports + props**

At the top of `components/canvas/AnimalCharacter.tsx`, add:

```typescript
import { useIntroAnimation, INTRO_SIGMA } from '@/lib/intro-animation'
import { useSiteStore } from '@/lib/store'
```

Extend the props interface:

```typescript
interface Props {
  animal: Animal
  count: number
  position?: [number, number, number]
  scale?: number
  /** When true, skip intro animation (e.g., returning from sub-page) */
  skipIntro?: boolean
}
```

Read intro state at component top (after `useState` for data):

```typescript
const reduceMotion = useSiteStore((s) => s.reduceMotion)
const intro = useIntroAnimation({ animal, skip: skipIntro || reduceMotion })
```

- [ ] **Step 2: Generate jitter starting positions for C fallback**

In the existing `useEffect` that loads char-sketch (after `origins.current = new Float32Array(positions)`), add a jitter buffer:

```typescript
const jittered = new Float32Array(positions.length)
for (let i = 0; i < positions.length; i += 3) {
  // Gaussian-ish via 6-uniform sum (cheap)
  const g = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.7
  const g2 = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.7
  jittered[i] = positions[i] + g * INTRO_SIGMA
  jittered[i + 1] = positions[i + 1] + g2 * INTRO_SIGMA
  jittered[i + 2] = positions[i + 2] // depth unchanged
}
```

Store in a new ref next to `origins`:

```typescript
const introStarts = useRef<Float32Array | null>(null)
// ...inside img.onload:
introStarts.current = jittered
```

Declare the ref alongside `origins` at the top:

```typescript
const introStarts = useRef<Float32Array | null>(null)
```

- [ ] **Step 3: Initialize positions to jittered start (when not skipping)**

After `setData({ positions, colors, sizes })`, but before that point, replace the initial positions buffer with the jittered version when intro is active:

```typescript
const initialPositions = (skipIntro || reduceMotion) ? positions : new Float32Array(jittered)
const finalData = { positions: initialPositions, colors, sizes }
origins.current = new Float32Array(positions) // origins are the TARGET (final)
introStarts.current = jittered
velocities.current = new Float32Array(positions.length)
setData(finalData)
```

(Remove the previous `origins.current = new Float32Array(positions)` if duplicated.)

- [ ] **Step 4: Drive intro lerp inside useFrame (before ripple/spring logic)**

In the `useFrame((state) => { ... })` callback, after `const t = state.clock.elapsedTime`, BEFORE the existing ripple/spring block, add:

```typescript
// Intro animation: lerp positions from introStarts toward origins
if (!intro.done && origins.current && introStarts.current && data) {
  const p = intro.particleProgress
  for (let i = 0; i < data.positions.length; i++) {
    data.positions[i] = introStarts.current[i] + (origins.current[i] - introStarts.current[i]) * p
  }
  if (pointsRef.current?.geometry.attributes.position) {
    ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  }
  // While intro is running, skip ripple/spring (positions are driven entirely by intro)
  return
}
```

Make sure this returns BEFORE the existing ripple/spring logic (so they don't fight during intro).

- [ ] **Step 5: Pass introAlpha to ParticleField**

In the JSX return, replace `<ParticleField positions={...} ... />` with:

```typescript
<ParticleField
  positions={data.positions}
  colors={data.colors}
  sizes={data.sizes}
  introAlpha={intro.particleAlpha}
/>
```

- [ ] **Step 6: Manual verify intro animation**

```
bun run dev
```

Open `http://localhost:3000/cat`. Hard-reload (Cmd+Shift+R). You should see:
1. Particles appear blurred/spread (~0.6 units around origins)
2. Over ~1.8s they collapse to cat silhouette
3. Particle alpha rises from 0.15 → 1 starting at 0.3s
4. After 1.8s, normal ripple + breathing resume

If position lerp looks wrong (e.g., particles converge from too far / look like flying-in instead of ink-wash), σ may need adjustment. Don't change yet — note for review.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/AnimalCharacter.tsx
git commit -m "feat(canvas): intro animation lerp from jittered origin (C fallback path)"
```

---

## Task 7: Zustand introState + skipIntro slice

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 1: Add introState + skipIntro to SiteState type**

Edit `lib/store.ts`. Add to the `SiteState` interface (find the existing interface, add new fields):

```typescript
interface SiteState {
  // ... existing fields ...
  /** Set when navigating from a sub-page back to hub; consumed by hub to skip intro */
  skipIntroOnNextHub: boolean
  setSkipIntroOnNextHub: (skip: boolean) => void
  /** Reserved for D path (entry triptych → hub continuation). null = no continuation, fall back to C. */
  introState: null | { animal: Animal; sourcePositions: Float32Array }
  setIntroState: (s: SiteState['introState']) => void
}
```

- [ ] **Step 2: Initialize + setters in store**

Inside the `create<SiteState>()(...)` body, add:

```typescript
skipIntroOnNextHub: false,
setSkipIntroOnNextHub: (skip) => set({ skipIntroOnNextHub: skip }),
introState: null,
setIntroState: (s) => set({ introState: s }),
```

These are session-scope; do NOT include in `partialize` (no localStorage persist).

- [ ] **Step 3: Run existing store tests to ensure no breakage**

```
bunx vitest run lib/__tests__/store.test.ts
```

Expected: PASS (new fields are additive).

- [ ] **Step 4: Commit**

```bash
git add lib/store.ts
git commit -m "feat(store): introState + skipIntroOnNextHub slices"
```

---

## Task 8: Wire skipIntro from sub-page navigation

**Files:**
- Modify: `app/cat/page.tsx` (consume flag)
- Modify: any cat sub-page links — but per current code, sub-pages don't exist yet, so this is scaffold only

- [ ] **Step 1: Add helper for setting skip flag**

Inside `lib/store.ts` (or `app/cat/_helpers.ts` if you prefer separation), nothing extra needed — direct store calls suffice.

When essays/toys pages are built later (Task 19/21 of master plan), they will call:

```typescript
useSiteStore.getState().setSkipIntroOnNextHub(true)
```

before navigating back to `/cat`. For now, document this contract in spec § 3.1 (already there).

- [ ] **Step 2: Hub reads + clears flag on mount**

Edit `app/cat/page.tsx`. In the existing `useEffect` (where `setAnimal('cat')` is called), extend it:

```typescript
const skipIntroOnNextHub = useSiteStore((s) => s.skipIntroOnNextHub)
const setSkipIntroOnNextHub = useSiteStore((s) => s.setSkipIntroOnNextHub)
const [skipThisIntro, setSkipThisIntro] = useState(false)

useEffect(() => {
  initStoreBrowser()
  setAnimal('cat')
  // Snapshot + clear the flag on mount so navigation cycle is one-shot
  if (skipIntroOnNextHub) {
    setSkipThisIntro(true)
    setSkipIntroOnNextHub(false)
  }
}, [setAnimal, skipIntroOnNextHub, setSkipIntroOnNextHub])
```

- [ ] **Step 3: Pass skipThisIntro to HubScene → AnimalCharacter**

Currently `HubScene` doesn't accept this prop. Edit `components/canvas/scenes/HubScene.tsx`:

```typescript
interface Props {
  animal: Animal
  skipIntro?: boolean
}

export function HubScene({ animal, skipIntro }: Props) {
  // ... existing code ...
  return (
    <PersistentCanvas fixed>
      <ambientLight intensity={0.5} />
      <AnimalCharacter
        animal={animal}
        count={charCount}
        position={...}
        scale={1.2}
        skipIntro={skipIntro}
      />
    </PersistentCanvas>
  )
}
```

Update `app/cat/page.tsx` to pass it:

```typescript
<HubScene animal="cat" skipIntro={skipThisIntro} />
```

- [ ] **Step 4: Commit**

```bash
git add app/cat/page.tsx components/canvas/scenes/HubScene.tsx
git commit -m "feat(cat-hub): consume skipIntroOnNextHub from store"
```

---

## Task 9: Mount NoteTag + QuoteHero in cat page, retire about.mdx

**Files:**
- Modify: `app/cat/page.tsx`
- Delete: `content/cat/about.mdx`

- [ ] **Step 1: Import + mount NoteTag**

Edit `app/cat/page.tsx`. Add imports:

```typescript
import { NoteTag } from '@/components/ui/NoteTag'
import { QuoteHero } from '@/components/ui/QuoteHero'
import { catBio } from '@/content/cat/bio'
import quotes from '@/content/cat/quotes.json'
import { useIntroAnimation } from '@/lib/intro-animation'
import { useSiteStore } from '@/lib/store'
```

Add intro hook usage inside the component (after the existing useState/useEffect blocks):

```typescript
const reduceMotion = useSiteStore((s) => s.reduceMotion)
const intro = useIntroAnimation({ animal: 'cat', skip: skipThisIntro || reduceMotion })
```

- [ ] **Step 2: Remove old hero + about.mdx body**

Delete these sections from the JSX:

- The `<section>` containing `<motion.h1>{voice.greeting}</motion.h1>` and `<motion.p>— find a corner that suits you —</motion.p>`
- The `<article>` containing `<About />`
- The `import About from '@/content/cat/about.mdx'` line

- [ ] **Step 3: Mount NoteTag and QuoteHero**

After `<HubScene animal="cat" skipIntro={skipThisIntro} />`, inside the existing content `<div className="min-h-screen ...">` (after `<TopBar animal="cat" />`):

```typescript
<NoteTag animal="cat" bio={catBio} textAlpha={intro.textAlpha} />
<QuoteHero animal="cat" quotes={quotes} textAlpha={intro.textAlpha} />
```

- [ ] **Step 4: Apply textAlpha to nav + footer**

Wrap the existing `<nav>` and `<footer>` with `style={{ opacity: intro.textAlpha, transition: 'opacity 350ms ease-out' }}` (or add to existing className via inline style).

Also pass `textAlpha` to TopBar — modify `components/ui/TopBar.tsx` props:

```typescript
interface Props {
  animal: Animal
  textAlpha?: number
}
```

In TopBar JSX root, add:

```typescript
style={{ opacity: textAlpha ?? 1, transition: 'opacity 350ms ease-out' }}
```

Update `app/cat/page.tsx`:

```typescript
<TopBar animal="cat" textAlpha={intro.textAlpha} />
```

- [ ] **Step 5: Delete about.mdx**

```bash
rm content/cat/about.mdx
```

- [ ] **Step 6: Manual verify whole flow**

```
bun run dev
```

Open `http://localhost:3000/cat`. Hard-reload. Expect:
1. Page starts dark (text invisible, particles spread)
2. At ~0.3s, text begins fading in (note tag, quote, top bar, nav, footer)
3. Particles converge to cat silhouette by ~1.8s
4. Hover over note tag → expand panel slides out to right
5. After animation, hovering near cat → ripple works; breathing visible

Refresh: animation replays. Note: essays/toys nav links currently dead (no sub-page yet); that's fine for this plan.

- [ ] **Step 7: Commit**

```bash
git add app/cat/page.tsx components/ui/TopBar.tsx
git rm content/cat/about.mdx
git commit -m "feat(cat-hub): mount NoteTag + QuoteHero, wire intro textAlpha"
```

---

## Task 10: Cleanup, full test pass, push

**Files:**
- None new; verification pass

- [ ] **Step 1: Run full test suite**

```
bunx vitest run
```

Expected: all tests PASS (existing 28 + new from Tasks 1, 2, 3, 4).

- [ ] **Step 2: Type check**

```
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Production build**

```
bun run build
```

Expected: clean build, no warnings about missing modules or shader compile errors.

- [ ] **Step 4: Final manual verification**

```
bun run start
```

Open `http://localhost:3000/cat`. Verify:
- Intro animation plays on first load
- Hard refresh: replays
- Bookmark / direct URL: still C fallback (introState is null)
- prefers-reduced-motion (via DevTools → Rendering → Emulate CSS media feature): no animation, content visible immediately
- Note tag hover/focus: panel expands; Tab key reaches it; Esc closes (browser focus behavior)
- Quote rotation: refresh 5 times, observe different quotes (at least 3 different by chance)
- Ripple: hover near cat → particles push and return
- Breathing: cat scale wobbles ~ every 3.5s

If anything fails, stop and capture details for follow-up.

- [ ] **Step 5: Push**

```bash
git push
```

Vercel will auto-deploy. Wait for build to complete (~2 min) then re-verify on production URL `https://llr-ego-mirror-maze.vercel.app/cat`.

---

## Out of scope for this plan

- **D path (entry triptych continuation)** — `introState` slice is in place; consumer code (`AnimalCharacter`) currently always uses C fallback (introStarts = origin + jitter). When entry triptych ships (master plan Task 18), add a code path: if `introState !== null`, use `introState.sourcePositions` as `introStarts` instead of jittered origins. No changes to `useIntroAnimation` or shader needed.
- **Wolf hub / Deer hub** — components are animal-prop-agnostic; wolf/deer hubs (master plan Task 16/17) will wire them with their own `quotes.json` + `bio.ts`.
- **Quote content verification** — placeholder quotes from candidate authors; user will verify/replace before public launch.

---

## Self-Review Notes (inline)

**Spec coverage:** ✓ Note tag (§1) → Tasks 2, 9. Quote rotation (§2) → Tasks 3, 9. Intro animation (§3) → Tasks 4-9. Bug fixes → Task 1. Spec §3.2 D path scaffold → Task 7. Spec §3.6 reduce-motion → Task 4 (skip flag).

**Type consistency:** ✓ `IntroState` shape consistent across Tasks 4, 6, 9. `Bio` type from Task 2 reused in Task 9. `Quote` type from Task 3 reused in Task 9.

**Placeholders:** ✓ No "TBD" or "TODO" in steps. Quote content is acknowledged as placeholder (Spec §2.3 already states "实施期填") — that's content, not a plan placeholder.
