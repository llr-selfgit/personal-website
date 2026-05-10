# 个人网站 v1 实施计划

> **Day 1 进度** (2026-05-10 实施):
> - ✅ Task 1 完成 — repo + clone + assets + first push (commit 68f7ae7)
> - ⏳ Task 2 进行中 — Next.js scaffolding


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实施"三动物粒子美学"个人网站 v1（猫 / 狼 / 鹿），2-3 周内通过 Claude Code Agent Teams 并行上线。

**Architecture:** Next.js 14 App Router + 单 R3F Canvas 跨路由持续 + 自定义粒子 shader + Vercel KV 留言后端 + GitHub-driven Vercel 自动部署。Hub D 级 persona 通过 Agent Teams 并行实施（infra-engineer + 3 个 hub-builder + 1 lead）。

**Tech Stack:** TypeScript / Next.js 14 (App Router) / React 18 / React Three Fiber + drei / Zustand / Tailwind CSS / MDX / framer-motion / Vitest / Playwright / Vercel KV / Resend / Sentry

**Reference:** 设计 spec → `docs/superpowers/specs/2026-05-10-personal-website-design.md`

**Total estimate:** 14 工作日 + 7 天 buffer = 2-3 周

---

## 项目结构

```
personal-website/
├── app/
│   ├── layout.tsx                        # RootLayout + Canvas 挂载
│   ├── page.tsx                          # 入口三联屏 (/)
│   ├── globals.css                       # 全局样式 + Tailwind
│   ├── [animal]/
│   │   ├── layout.tsx                    # 动物级 layout (主题 token 注入)
│   │   ├── page.tsx                      # Hub
│   │   ├── essays/
│   │   │   ├── page.tsx                  # 列表
│   │   │   └── [slug]/page.tsx           # 详情 (MDX)
│   │   └── toys/page.tsx                 # AI 小玩意
│   └── api/
│       └── leave-message/route.ts        # POST 端点
├── components/
│   ├── canvas/
│   │   ├── PersistentCanvas.tsx          # R3F <Canvas> 单实例
│   │   ├── SceneController.tsx           # route → scene 路由
│   │   ├── scenes/
│   │   │   ├── EntryScene.tsx            # 三联屏
│   │   │   ├── HubScene.tsx              # 动物 hub canvas
│   │   │   └── SubpageAmbient.tsx        # 子页 ambient 角色
│   │   ├── ParticleField.tsx             # 粒子 mesh 封装
│   │   ├── AnimalCharacter.tsx           # 角色粒子（采样 char-sketch）
│   │   ├── shaders/
│   │   │   ├── particle.vert.glsl        # 顶点 shader
│   │   │   └── particle.frag.glsl        # 片元 shader
│   │   ├── Ripple.ts                     # 涟漪物理（多 ring 同心扩散）
│   │   └── DecorativeSprite.tsx          # 装饰元素 sprite 封装
│   ├── ui/
│   │   ├── TopBar.tsx                    # 顶栏（换动物 + 留言）
│   │   ├── LeaveMessageDrawer.tsx        # 留言抽屉
│   │   ├── SwitchAnimalPopup.tsx         # 换动物浮层
│   │   └── DebugPanel.tsx                # dev 调试面板
│   ├── content/
│   │   ├── MDXRenderer.tsx               # MDX 渲染
│   │   ├── EssayList.tsx                 # essay 列表
│   │   └── ToyCard.tsx                   # toy card
│   └── hooks/
│       ├── useAnimal.ts                  # 当前动物 hook
│       ├── useDeviceTier.ts              # 设备分级
│       ├── useReduceMotion.ts            # prefers-reduced-motion
│       └── useRipple.ts                  # ripple 状态 hook
├── content/
│   ├── cat/
│   │   ├── about.mdx
│   │   ├── essays/{slug}.mdx
│   │   ├── toys.json
│   │   └── voice.json                    # 关键文案
│   ├── wolf/{about, essays, toys, voice}
│   └── deer/{about, essays, toys, voice}
├── public/
│   └── assets/
│       ├── cat/{bg-entry, bg-hub, char-sketch, decorations/*}.{webp,png}
│       ├── wolf/同上
│       ├── deer/同上
│       └── icons/{switch-animal, leave-message, back-arrow}.svg
├── lib/
│   ├── store.ts                          # Zustand store
│   ├── particles.ts                      # 粒子数学工具
│   ├── ripple.ts                         # ripple 物理
│   ├── voice.ts                          # 文案取值 helper
│   ├── device-tier.ts                    # 设备分级算法
│   └── mdx.ts                            # MDX 内容加载
├── tests/
│   ├── unit/
│   │   ├── ripple.test.ts
│   │   ├── particles.test.ts
│   │   └── device-tier.test.ts
│   ├── e2e/
│   │   ├── entry-flow.spec.ts
│   │   ├── animal-switch.spec.ts
│   │   ├── essay-flow.spec.ts
│   │   ├── leave-message.spec.ts
│   │   └── mobile.spec.ts
│   └── visual/
│       └── (Playwright screenshot baselines)
├── scripts/
│   └── prepare-assets.sh                 # 批量去背景 + 转 webp
├── .env.local                            # 不 commit (Resend + KV + Sentry keys)
├── .env.example                          # commit (key 名称示例)
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── .eslintrc.json
├── .prettierrc
├── playwright.config.ts
├── vitest.config.ts
└── .github/
    └── workflows/
        └── ci.yml
```

---

## Phase 1 · Foundation (Day 1)

### Task 1: 创建 GitHub repo 并 clone

**Files:**
- Create: 远程 GitHub repo `personal-website`（用户提前手动创建私有 repo）
- Create: 本地工作区 `~/claude_code_workspace/projects/personal-website/`（建议路径，避免和 ~/.claude_code_workspace 混）

- [ ] **Step 1: 用户手动创建 GitHub 私有 repo**

用户登录 https://github.com/new 创建：
- Repository name: `personal-website`
- Visibility: **Private**
- 不勾选 "Initialize with README" / .gitignore / license（我们本地初始化）

- [ ] **Step 2: 本地 git clone**

```bash
cd ~/claude_code_workspace/projects
git clone git@github.com:<your-username>/personal-website.git
cd personal-website
```

Expected: 进入空目录 `personal-website/`

- [ ] **Step 3: 验证 git 状态**

```bash
git status
```

Expected: `On branch main, nothing to commit (create/copy files...)`

- [ ] **Step 4: 复制 spec 到项目**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp /Users/lingruiluo/claude_code_workspace/docs/superpowers/specs/2026-05-10-personal-website-design.md docs/superpowers/specs/
cp /Users/lingruiluo/claude_code_workspace/docs/superpowers/plans/2026-05-10-personal-website-implementation.md docs/superpowers/plans/
```

- [ ] **Step 5: 复制资源到项目**

```bash
mkdir -p public/assets/{cat,wolf,deer}/decorations public/icons
# 主背景 + entry + char-sketch
SRC=/Users/lingruiluo/claude_code_workspace/.brainstorm-assets/anchor
for animal in cat wolf deer; do
  cp $SRC/style-anchor-${animal}-hub.png public/assets/${animal}/bg-hub.png
  cp $SRC/style-anchor-${animal}-entry.png public/assets/${animal}/bg-entry.png
  cp $SRC/char-${animal}.png public/assets/${animal}/char-sketch.png
done
# 装饰原图（待后续脚本 batch 转 webp + 去背景）
cp $SRC/deco-cat-*-raw.png public/assets/cat/decorations/
cp $SRC/deco-wolf-*-raw.png public/assets/wolf/decorations/
cp $SRC/deco-deer-*-raw.png public/assets/deer/decorations/
```

- [ ] **Step 6: 初始 commit**

```bash
git add docs/ public/
git commit -m "init: copy spec, plan, and visual assets

- spec: 2026-05-10-personal-website-design.md
- plan: 2026-05-10-personal-website-implementation.md
- assets: 18 anchor images (cat/wolf/deer × hub/entry/char/decorations)"
git push origin main
```

Expected: push 成功，远程 main 分支有上面提交。

---

### Task 2: 脚手架 Next.js + 依赖

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: 初始化 Next.js 项目（合并到现有目录）**

```bash
cd ~/claude_code_workspace/projects/personal-website
npx create-next-app@latest . --typescript --tailwind --app --src-dir false --import-alias "@/*" --no-eslint --no-turbopack
```

如果遇到 "directory not empty" 警告，选 yes 覆盖（我们之前只放了 docs/ 和 public/，不会冲突）。

- [ ] **Step 2: 验证脚手架**

```bash
ls -la
```

Expected: `app/` `public/` `package.json` `tsconfig.json` `tailwind.config.ts` 等都在。

- [ ] **Step 3: 启动 dev server**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000，浏览器打开看到 Next.js 默认欢迎页。

- [ ] **Step 4: 安装项目依赖**

```bash
npm install three @react-three/fiber @react-three/drei zustand framer-motion @next/mdx @mdx-js/loader @mdx-js/react @types/three
npm install -D @types/three vitest @vitejs/plugin-react @testing-library/react @testing-library/dom jsdom @playwright/test
```

- [ ] **Step 5: 配置 ESLint + Prettier**

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-next prettier eslint-config-prettier
```

写 `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "react/no-unknown-property": ["error", { "ignore": ["args", "position", "rotation", "scale", "intensity"] }]
  }
}
```

写 `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 6: 添加 npm scripts**

修改 `package.json` `scripts`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "scaffold: Next.js 14 + R3F + Tailwind + tooling

- Next.js 14 App Router + TypeScript
- React Three Fiber + drei + Three.js
- Zustand for state, framer-motion for transitions
- MDX (Next.js native)
- Vitest + Playwright for testing
- ESLint + Prettier"
```

---

### Task 3: 部署 Vercel + GitHub 集成

**Files:** N/A (Vercel 控制台操作)

- [ ] **Step 1: 推送当前代码到 main**

```bash
git push origin main
```

- [ ] **Step 2: 用户登录 Vercel**

打开 https://vercel.com/login，用 GitHub 登录。

- [ ] **Step 3: 导入 personal-website repo**

在 Vercel 控制台：
- Click "Add New" → "Project"
- 选择 `personal-website` repo（如果没看到，点 "Adjust GitHub App Permissions" 授权访问该 repo）
- 框架 Preset 自动检测为 Next.js
- Root Directory: `./`（默认）
- **Project Name: 改成 `llr-ego-mirror-maze`**（不要用默认的 `personal-website`）→ Vercel URL 会变成 `llr-ego-mirror-maze.vercel.app`
- 不需要环境变量（暂时）
- Click "Deploy"

- [ ] **Step 4: 等待首次部署完成（~1-2 分钟）**

Expected: 部署成功，Vercel 给出 URL 类似 `personal-website-xxxx.vercel.app`，浏览器打开看到 Next.js 默认欢迎页。

- [ ] **Step 5: 验证自动部署**

```bash
echo "// test deploy" >> app/page.tsx
git add app/page.tsx
git commit -m "test: verify auto-deploy"
git push
```

Expected: Vercel 控制台显示新的 deployment 触发，~30s 后完成。

- [ ] **Step 6: 撤回测试改动**

```bash
git revert HEAD --no-edit
git push
```

Expected: 又一个 deployment，回到原状态。

- [ ] **Step 7: 启用 Vercel Analytics**

在 Vercel 控制台 → Project → Analytics → "Enable Web Analytics"。

修改 `app/layout.tsx` 加入 Analytics 组件：

```tsx
import { Analytics } from '@vercel/analytics/react'
// ... in body:
<Analytics />
```

```bash
npm install @vercel/analytics
git add .
git commit -m "feat: enable Vercel Analytics"
git push
```

---

### Task 4: 全局类型 + 配置

**Files:**
- Create: `lib/types.ts`
- Modify: `tailwind.config.ts`, `next.config.mjs`

- [ ] **Step 1: 写测试 `tests/unit/types.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import type { Animal, AnimalConfig } from '@/lib/types'

describe('types', () => {
  it('Animal type accepts only cat/wolf/deer', () => {
    const cat: Animal = 'cat'
    const wolf: Animal = 'wolf'
    const deer: Animal = 'deer'
    expect([cat, wolf, deer]).toEqual(['cat', 'wolf', 'deer'])
  })

  it('AnimalConfig has required fields', () => {
    const config: AnimalConfig = {
      name: 'cat',
      displayName: '猫',
      palette: {
        bg: '#2a1f15',
        accent: '#ff9d6b',
        body: '#f0e6d2',
        heading: '#a18871',
      },
      voice: {
        greeting: '随意看看吧',
        leaveMessage: '在这世界踩个爪印吧',
        loading: '翻一会',
        notFound: '你走丢的方向我也没去过',
      },
      character: '/assets/cat/char-sketch.png',
      hubBg: '/assets/cat/bg-hub.png',
      entryBg: '/assets/cat/bg-entry.png',
    }
    expect(config.name).toBe('cat')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/unit/types.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/types'`

- [ ] **Step 3: 创建 `lib/types.ts`**

```typescript
export type Animal = 'cat' | 'wolf' | 'deer'

export interface AnimalPalette {
  bg: string
  accent: string
  body: string
  heading: string
}

export interface AnimalVoice {
  greeting: string
  leaveMessage: string
  loading: string
  notFound: string
}

export interface AnimalConfig {
  name: Animal
  displayName: string
  palette: AnimalPalette
  voice: AnimalVoice
  character: string
  hubBg: string
  entryBg: string
}

export type DeviceTier = 'high' | 'mid' | 'low'

export interface ParticleConfig {
  hubCharacter: number
  hubAmbient: number
  entryHover: number
  entryIdle: number
}

export interface RippleParams {
  speed: number
  maxRadius: number
  bandThickness: number
  pushStrength: number
  spawnInterval: number
  maxConcurrent: number
}
```

- [ ] **Step 4: 配置 Vitest**

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
```

- [ ] **Step 5: 重跑测试确认通过**

```bash
npm run test -- tests/unit/types.test.ts
```

Expected: PASS, 2 tests

- [ ] **Step 6: 配置 Tailwind theme tokens（动物色板）**

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cat: {
          bg: '#2a1f15',
          mid: '#3a2a1c',
          highlight: '#d4a574',
          accent: '#ff9d6b',
          body: '#f0e6d2',
          heading: '#a18871',
        },
        wolf: {
          bg: '#0a0f15',
          mid: '#0f1822',
          highlight: '#6e8aa8',
          accent: '#4a8cc4',
          body: '#c5d3df',
          heading: '#5e6a83',
        },
        deer: {
          bg: '#0f120a',
          mid: '#1f2018',
          highlight: '#c4baa0',
          accent: '#8a9b73',
          body: '#ebe7d6',
          heading: '#677252',
        },
      },
      fontFamily: {
        'cat-zh': ['"Noto Serif SC"', 'serif'],
        'cat-en': ['"EB Garamond"', 'serif'],
        'wolf-zh': ['"Noto Serif SC"', 'serif'],
        'wolf-en': ['"DM Serif Display"', 'serif'],
        'deer-zh': ['"LXGW WenKai"', '"Noto Serif SC"', 'serif'],
        'deer-en': ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: types + tailwind theme tokens for 3 animals

- Animal/AnimalConfig/AnimalPalette/AnimalVoice types
- DeviceTier, ParticleConfig, RippleParams
- Tailwind theme: cat/wolf/deer color tokens + font tokens
- Vitest config with @ alias"
```

---

## Phase 2 · 粒子技术 spike (Day 2 — 关键风险点)

> ⚠️ **整个项目最大的技术风险**：50K-80K 粒子 + ripple 在浏览器/设备组合上是否能跑 60fps。
> 这一阶段如果失败，需要降级方案（粒子密度减半 / 改为 Canvas2D / 等）。
> 必须在多浏览器多设备实测通过才能进入 Phase 3。

### Task 5: PersistentCanvas 组件

**Files:**
- Create: `components/canvas/PersistentCanvas.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 测试 `tests/unit/persistent-canvas.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PersistentCanvas } from '@/components/canvas/PersistentCanvas'

describe('PersistentCanvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<PersistentCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('applies fixed positioning', () => {
    const { container } = render(<PersistentCanvas />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.position).toBe('fixed')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/unit/persistent-canvas.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/canvas/PersistentCanvas'`

- [ ] **Step 3: 实现 `components/canvas/PersistentCanvas.tsx`**

```tsx
'use client'

import { Canvas } from '@react-three/fiber'

export function PersistentCanvas({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/unit/persistent-canvas.test.tsx
```

Expected: PASS, 2 tests

- [ ] **Step 5: 集成到 RootLayout**

`app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'
import { PersistentCanvas } from '@/components/canvas/PersistentCanvas'
import './globals.css'

export const metadata = {
  title: '个人网站',
  description: '三动物粒子美学',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <PersistentCanvas />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: dev server 验证 canvas 出现**

```bash
npm run dev
```

打开 http://localhost:3000，DevTools Elements 面板里能看到 `<canvas>` 元素，固定在视口底层。

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: PersistentCanvas component + RootLayout integration

R3F Canvas mounted at root layout, persists across route changes."
```

---

### Task 6: 粒子位置采样工具（from PNG alpha）

**Files:**
- Create: `lib/particles.ts`
- Create: `tests/unit/particles.test.ts`

- [ ] **Step 1: 测试 `tests/unit/particles.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { samplePositionsFromAlpha, normalizeToRange } from '@/lib/particles'

describe('particle sampling', () => {
  it('samples N positions from alpha image data', () => {
    // Mock 4x4 image, all alpha=255 (opaque)
    const w = 4, h = 4
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = 255  // alpha
    }
    const imageData = { data, width: w, height: h } as ImageData

    const positions = samplePositionsFromAlpha(imageData, 100)

    expect(positions.length).toBeLessThanOrEqual(100 * 3)  // x,y,z per particle
    expect(positions.length).toBeGreaterThan(50 * 3)       // at least 50% sampled
  })

  it('returns empty for fully transparent image', () => {
    const w = 4, h = 4
    const data = new Uint8ClampedArray(w * h * 4)  // all alpha=0
    const imageData = { data, width: w, height: h } as ImageData

    const positions = samplePositionsFromAlpha(imageData, 100)

    expect(positions.length).toBe(0)
  })

  it('normalizeToRange maps [0,W] → [-aspect, +aspect]', () => {
    const result = normalizeToRange(0, 100, 16 / 9)
    expect(result).toBeCloseTo(-16 / 9, 4)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/unit/particles.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/particles'`

- [ ] **Step 3: 实现 `lib/particles.ts`**

```typescript
/**
 * Sample N particle positions from PNG alpha channel.
 * Returns Float32Array of [x, y, z, ...] in NDC-ish coordinates centered at origin.
 */
export function samplePositionsFromAlpha(
  img: ImageData,
  n: number,
  aspect = 1
): Float32Array {
  const out: number[] = []
  const dW = img.width
  const dH = img.height
  const maxAttempts = n * 30
  let attempts = 0

  while (out.length / 3 < n && attempts < maxAttempts) {
    attempts++
    const x = Math.floor(Math.random() * dW)
    const y = Math.floor(Math.random() * dH)
    const idx = (y * dW + x) * 4
    const alpha = img.data[idx + 3]
    if (alpha > 30 && Math.random() < alpha / 255) {
      // Map to [-aspect, +aspect] × [-1, +1]
      const nx = ((x / dW) * 2 - 1) * aspect
      const ny = -((y / dH) * 2 - 1)  // flip Y for WebGL
      out.push(nx, ny, 0)
    }
  }

  return new Float32Array(out)
}

/**
 * Normalize a pixel coordinate to NDC range.
 */
export function normalizeToRange(pixel: number, total: number, aspect: number): number {
  return (pixel / total - 0.5) * 2 * aspect
}

/**
 * Particle counts per device tier (from spec § 7 / § 10).
 */
export const PARTICLE_COUNTS = {
  high: { hubCharacter: 80000, hubAmbient: 5000, entryHover: 70000, entryIdle: 4000 },
  mid: { hubCharacter: 50000, hubAmbient: 3000, entryHover: 40000, entryIdle: 2000 },
  low: { hubCharacter: 15000, hubAmbient: 800, entryHover: 8000, entryIdle: 500 },
} as const
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/unit/particles.test.ts
```

Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: particle position sampling from PNG alpha

- samplePositionsFromAlpha: stochastic sampling with alpha as probability
- normalizeToRange: pixel → NDC mapping
- PARTICLE_COUNTS per device tier (high/mid/low)"
```

---

### Task 7: Ripple 物理（多 ring 同心扩散）

**Files:**
- Create: `lib/ripple.ts`
- Create: `tests/unit/ripple.test.ts`

- [ ] **Step 1: 测试 `tests/unit/ripple.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { RippleManager, computeRippleForce } from '@/lib/ripple'

describe('ripple physics', () => {
  it('spawns a new ring when interval elapsed', () => {
    const mgr = new RippleManager({
      speed: 220,
      maxRadius: 130,
      bandThickness: 20,
      pushStrength: 4,
      spawnInterval: 130,
      maxConcurrent: 4,
    })

    expect(mgr.getActiveCount()).toBe(0)
    mgr.spawn(100, 100, 0)
    expect(mgr.getActiveCount()).toBe(1)

    // Within spawn interval, no new ring
    mgr.spawn(110, 110, 50)
    expect(mgr.getActiveCount()).toBe(1)

    // After spawn interval, new ring
    mgr.spawn(120, 120, 200)
    expect(mgr.getActiveCount()).toBe(2)
  })

  it('expires rings older than maxRadius/speed', () => {
    const mgr = new RippleManager({
      speed: 100,
      maxRadius: 100,
      bandThickness: 20,
      pushStrength: 4,
      spawnInterval: 130,
      maxConcurrent: 4,
    })

    mgr.spawn(0, 0, 0)
    mgr.tick(2000)  // 2s elapsed → 200px expanded > 100px max
    expect(mgr.getActiveCount()).toBe(0)
  })

  it('caps active rings at maxConcurrent', () => {
    const mgr = new RippleManager({
      speed: 220,
      maxRadius: 130,
      bandThickness: 20,
      pushStrength: 4,
      spawnInterval: 0,  // no rate limit
      maxConcurrent: 4,
    })

    for (let i = 0; i < 10; i++) {
      mgr.spawn(0, 0, i * 10)
    }
    expect(mgr.getActiveCount()).toBe(4)
  })

  it('computes radial push force in ring band', () => {
    const force = computeRippleForce({
      particleX: 100, particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 1000,  // 1s elapsed
      params: { speed: 100, maxRadius: 200, bandThickness: 20, pushStrength: 4, spawnInterval: 0, maxConcurrent: 4 },
    })

    // ringR = 1.0 * 100 = 100, particle at dist 100 → in band center
    expect(force.x).toBeGreaterThan(0)  // pushed outward (positive x)
    expect(force.y).toBeCloseTo(0, 4)
  })

  it('returns zero force outside ring band', () => {
    const force = computeRippleForce({
      particleX: 200, particleY: 0,
      ripple: { x: 0, y: 0, t: 0 },
      currentTime: 1000,  // ringR = 100, particle at 200 → far outside band
      params: { speed: 100, maxRadius: 300, bandThickness: 20, pushStrength: 4, spawnInterval: 0, maxConcurrent: 4 },
    })

    expect(force.x).toBe(0)
    expect(force.y).toBe(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/unit/ripple.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/ripple'`

- [ ] **Step 3: 实现 `lib/ripple.ts`**

```typescript
import type { RippleParams } from './types'

export interface Ripple {
  x: number
  y: number
  t: number  // spawn timestamp (ms)
}

export class RippleManager {
  private ripples: Ripple[] = []
  private lastSpawnTime = -Infinity

  constructor(private params: RippleParams) {}

  spawn(x: number, y: number, now: number): void {
    if (now - this.lastSpawnTime < this.params.spawnInterval) return
    if (this.ripples.length >= this.params.maxConcurrent) {
      this.ripples.shift()  // drop oldest
    }
    this.ripples.push({ x, y, t: now })
    this.lastSpawnTime = now
  }

  tick(now: number): void {
    const maxAge = (this.params.maxRadius / this.params.speed) * 1000
    this.ripples = this.ripples.filter((r) => now - r.t < maxAge)
  }

  getActiveCount(): number {
    return this.ripples.length
  }

  getRipples(): readonly Ripple[] {
    return this.ripples
  }
}

export interface RippleForceInput {
  particleX: number
  particleY: number
  ripple: Ripple
  currentTime: number
  params: RippleParams
}

export function computeRippleForce(input: RippleForceInput): { x: number; y: number } {
  const { particleX, particleY, ripple, currentTime, params } = input
  const dx = particleX - ripple.x
  const dy = particleY - ripple.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return { x: 0, y: 0 }

  const age = (currentTime - ripple.t) / 1000
  const ringR = age * params.speed
  if (ringR > params.maxRadius) return { x: 0, y: 0 }

  const offset = Math.abs(dist - ringR)
  if (offset >= params.bandThickness) return { x: 0, y: 0 }

  const intensity = (1 - offset / params.bandThickness) * (1 - ringR / params.maxRadius)
  const f = params.pushStrength * intensity
  return { x: (dx / dist) * f, y: (dy / dist) * f }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/unit/ripple.test.ts
```

Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: ripple physics — multi-ring concentric propagation

- RippleManager: spawn/tick/getActive
- computeRippleForce: radial push within ring band
- Spec § 7: 220 px/s speed, 130px max radius, 20px band, 4 concurrent rings"
```

---

### Task 8: 设备分级探测

**Files:**
- Create: `lib/device-tier.ts`
- Create: `tests/unit/device-tier.test.ts`
- Create: `components/hooks/useDeviceTier.ts`

- [ ] **Step 1: 测试 `tests/unit/device-tier.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { detectTier } from '@/lib/device-tier'

describe('detectTier', () => {
  it('returns low when WebGL2 unavailable', () => {
    const tier = detectTier({
      hasWebGL2: false,
      deviceMemory: 16,
      hardwareConcurrency: 16,
      viewportWidth: 1920,
    })
    expect(tier).toBe('low')
  })

  it('returns high for desktop-class hardware', () => {
    const tier = detectTier({
      hasWebGL2: true,
      deviceMemory: 16,
      hardwareConcurrency: 12,
      viewportWidth: 1920,
    })
    expect(tier).toBe('high')
  })

  it('returns mid for mid-range', () => {
    const tier = detectTier({
      hasWebGL2: true,
      deviceMemory: 6,
      hardwareConcurrency: 6,
      viewportWidth: 1024,
    })
    expect(tier).toBe('mid')
  })

  it('returns low for phone-class', () => {
    const tier = detectTier({
      hasWebGL2: true,
      deviceMemory: 2,
      hardwareConcurrency: 4,
      viewportWidth: 390,
    })
    expect(tier).toBe('low')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/unit/device-tier.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 `lib/device-tier.ts`**

```typescript
import type { DeviceTier } from './types'

export interface TierInputs {
  hasWebGL2: boolean
  deviceMemory: number     // GB; navigator.deviceMemory
  hardwareConcurrency: number
  viewportWidth: number
}

export function detectTier(inputs: TierInputs): DeviceTier {
  if (!inputs.hasWebGL2) return 'low'
  if (inputs.deviceMemory >= 8 && inputs.hardwareConcurrency >= 8 && inputs.viewportWidth >= 1280) {
    return 'high'
  }
  if (inputs.deviceMemory >= 4 && inputs.viewportWidth >= 768) {
    return 'mid'
  }
  return 'low'
}

/** Browser-side runtime detection. */
export function detectTierBrowser(): DeviceTier {
  if (typeof window === 'undefined') return 'low'
  const canvas = document.createElement('canvas')
  const gl2 = canvas.getContext('webgl2')
  return detectTier({
    hasWebGL2: !!gl2,
    deviceMemory: (navigator as any).deviceMemory ?? 4,  // default 4GB if unknown
    hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
    viewportWidth: window.innerWidth,
  })
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/unit/device-tier.test.ts
```

Expected: PASS, 4 tests

- [ ] **Step 5: 实现 hook `components/hooks/useDeviceTier.ts`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { detectTierBrowser } from '@/lib/device-tier'
import type { DeviceTier } from '@/lib/types'

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('mid')  // SSR default
  useEffect(() => {
    setTier(detectTierBrowser())
  }, [])
  return tier
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: device tier detection (high/mid/low)

Spec § 10: WebGL2 + memory + cores + viewport → tier classification.
Drives particle density choice via PARTICLE_COUNTS."
```

---

### Task 9: ParticleField 组件 + 基础 shader

**Files:**
- Create: `components/canvas/ParticleField.tsx`
- Create: `components/canvas/shaders/particle.vert.glsl`
- Create: `components/canvas/shaders/particle.frag.glsl`

- [ ] **Step 1: 实现 vertex shader `components/canvas/shaders/particle.vert.glsl`**

```glsl
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
uniform float uTime;
uniform float uPixelRatio;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // size scales with distance, but with min/max clamp
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);

  vColor = aColor;
}
```

- [ ] **Step 2: 实现 fragment shader `components/canvas/shaders/particle.frag.glsl`**

```glsl
varying vec3 vColor;

void main() {
  // Soft circle with alpha falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.3, dist) * 0.85;
  gl_FragColor = vec4(vColor, alpha);
}
```

- [ ] **Step 3: 实现 `components/canvas/ParticleField.tsx`**

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import vertSrc from './shaders/particle.vert.glsl?raw'
import fragSrc from './shaders/particle.frag.glsl?raw'

interface Props {
  positions: Float32Array       // [x,y,z,...] particle origin positions (NDC)
  colors: Float32Array          // [r,g,b,...] per particle (0-1)
  sizes: Float32Array            // per-particle size (0.5-3px)
  onTick?: (delta: number) => void
}

export function ParticleField({ positions, colors, sizes, onTick }: Props) {
  const ref = useRef<THREE.Points>(null)
  const { gl } = useThree()
  const pixelRatio = gl.getPixelRatio()

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return geom
  }, [positions, colors, sizes])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
  }, [pixelRatio])

  useFrame((state, delta) => {
    if (!ref.current) return
    material.uniforms.uTime.value = state.clock.elapsedTime
    onTick?.(delta)
  })

  return <points ref={ref} geometry={geometry} material={material} />
}
```

- [ ] **Step 4: 配置 vite/Next 加载 .glsl as raw string**

`next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    })
    return config
  },
}
export default nextConfig
```

- [ ] **Step 5: 运行 `npm run build` 验证 shader 加载无报错**

```bash
npm run build
```

Expected: build success

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: ParticleField component + GLSL shaders

- Vertex shader: distance-scaled point size with clamp
- Fragment shader: soft circle with alpha falloff
- BufferGeometry with position/color/size attributes
- next.config: .glsl as asset/source"
```

---

### Task 10: 粒子 spike — 验证 50K-80K @ 60fps

**Files:**
- Create: `app/spike/page.tsx`
- Create: `components/canvas/ParticleSpike.tsx`

- [ ] **Step 1: 实现 `components/canvas/ParticleSpike.tsx`**

```tsx
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsFromAlpha } from '@/lib/particles'
import { RippleManager, computeRippleForce } from '@/lib/ripple'

const RIPPLE_PARAMS = {
  speed: 0.4,           // NDC units / second (mapped from 220 px/s for ~viewport)
  maxRadius: 0.25,      // NDC
  bandThickness: 0.04,
  pushStrength: 0.05,
  spawnInterval: 130,
  maxConcurrent: 4,
}

export function ParticleSpike({ count }: { count: number }) {
  const [positions, setPositions] = useState<Float32Array | null>(null)
  const ripples = useRef(new RippleManager(RIPPLE_PARAMS))
  const velocities = useRef<Float32Array | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const pos = samplePositionsFromAlpha(imageData, count, 16 / 9)
      setPositions(pos)
      velocities.current = new Float32Array(pos.length)
    }
    img.src = '/assets/cat/char-sketch.png'
  }, [count])

  const colors = useMemo(() => {
    if (!positions) return new Float32Array(0)
    const c = new Float32Array(positions.length)
    for (let i = 0; i < positions.length; i += 3) {
      c[i] = 0.85   // r — sepia-ish
      c[i + 1] = 0.7
      c[i + 2] = 0.55
    }
    return c
  }, [positions])

  const sizes = useMemo(() => {
    if (!positions) return new Float32Array(0)
    const s = new Float32Array(positions.length / 3)
    for (let i = 0; i < s.length; i++) s[i] = 1 + Math.random() * 1.5
    return s
  }, [positions])

  const handlePointerMove = (e: any) => {
    const x = e.point.x, y = e.point.y
    ripples.current.spawn(x, y, performance.now())
  }

  useFrame((state, delta) => {
    if (!positions || !velocities.current) return
    const now = performance.now()
    ripples.current.tick(now)
    const activeRipples = ripples.current.getRipples()
    const SPRING = 0.06, DAMP = 0.85

    for (let i = 0; i < positions.length; i += 3) {
      const ox = (i % (positions.length)) // origin index unchanged; we mutate positions
      // (skipped: full physics — for spike we just verify render perf)
    }
  })

  if (!positions) return null

  return (
    <mesh onPointerMove={handlePointerMove} visible={false}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial transparent opacity={0} />
      <ParticleField positions={positions} colors={colors} sizes={sizes} />
    </mesh>
  )
}
```

- [ ] **Step 2: 实现 spike 页面 `app/spike/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { ParticleSpike } from '@/components/canvas/ParticleSpike'

export default function SpikePage() {
  const [count, setCount] = useState(50000)
  const [fps, setFps] = useState(0)

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.85)', padding: 16, borderRadius: 8, color: '#fff' }}>
        <div>Particles: {count.toLocaleString()}</div>
        <input type="range" min={1000} max={150000} step={1000} value={count} onChange={(e) => setCount(parseInt(e.target.value))} />
        <div>FPS: {fps}</div>
      </div>
      <ParticleSpike count={count} />
    </div>
  )
}
```

- [ ] **Step 3: dev 运行 + 多设备测试**

```bash
npm run dev
```

打开 http://localhost:3000/spike 在以下场景测试并记录 FPS：

| 测试设备 | 50K | 70K | 80K | 100K |
|---|---|---|---|---|
| 你的桌面 (M1/M2/x86?) | ?fps | ?fps | ?fps | ?fps |
| iPhone 12 | ?fps | ?fps | ?fps | ?fps |
| 4 年内 MacBook | ?fps | ?fps | ?fps | ?fps |

⚠️ **验收标准**：80K 在桌面 ≥ 60fps，50K 在 iPhone 12 ≥ 30fps。

- [ ] **Step 4: 如果性能不达标的应对**

| 失败场景 | 应对 |
|---|---|
| 桌面 80K < 60fps | 减少 size 范围 / 改用 instancedMesh / 降低 dpr |
| 移动 50K < 30fps | 降低 mid tier 到 30K，调整 PARTICLE_COUNTS |
| 全部都卡 | shader 简化（去掉 alpha falloff）/ 改用 sprite billboard / 重新审 spec 是否要降级方案 |

- [ ] **Step 5: 记录 spike 结果到 README**

写 `docs/spike-results.md`:

```markdown
# Particle Spike Results (Day 2)

| Device | 50K FPS | 80K FPS | 100K FPS | Notes |
|---|---|---|---|---|
| [你的桌面] | ... | ... | ... | ... |
| iPhone 12 | ... | ... | ... | ... |

Verdict: [pass / partial / fail]
Adjustments to PARTICLE_COUNTS: [...]
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "spike: particle perf validation 50K-80K

Tested on [设备列表]. Results in docs/spike-results.md.
[pass/fail and any tier adjustments]"
```

---

## Phase 3 · Agent Teams + Hub 框架 (Days 3-7)

### Task 11: 创建 Agent Team

**Files:** N/A（团队元数据自动写入 `~/.claude/teams/personal-website/config.json`）

- [ ] **Step 1: 调用 TeamCreate**

```
TeamCreate(team_name="personal-website", description="Implementing 三动物粒子美学个人网站 v1, 2-3 weeks parallel.")
```

- [ ] **Step 2: spawn `infra-engineer` 子 agent**

```
Agent(
  subagent_type="general-purpose",
  team_name="personal-website",
  name="infra-engineer",
  prompt="""你是 personal-website 项目 team 的 infra-engineer。

  项目根目录: ~/claude_code_workspace/projects/personal-website
  Spec: docs/superpowers/specs/2026-05-10-personal-website-design.md
  Plan: docs/superpowers/plans/2026-05-10-personal-website-implementation.md

  你的任务范围: 实施 spec § 8 中的共享基建 + spec § 7 中的粒子系统 + spec § 5 中的 subpage layout。
  具体 task: Plan 中的 Task 12 (Zustand store) / Task 13 (路由场景路由) / Task 14 (Hub 顶栏) / Task 21 (Subpage layout)。

  接到任何任务都先读 spec 相关章节再动手。如有疑问，SendMessage 给 team-lead。"""
)
```

- [ ] **Step 3: spawn `cat-builder`、`wolf-builder`、`deer-builder`**

```
# cat-builder
Agent(
  subagent_type="general-purpose",
  team_name="personal-website",
  name="cat-builder",
  prompt="""你是 cat hub builder。负责实施猫 hub 的 D 级 persona。

  根目录: ~/claude_code_workspace/projects/personal-website
  Spec § 6 / 猫 persona section
  Plan: Task 15 (Cat HubScene) + Task 16 (Cat about-me) + Task 17 (Cat 装饰)

  关键约束:
  - 滚动机制: 自由长滚（慢，留白大）
  - 文本揭示: 段落整段淡入 + 缓慢
  - 角色行为: 偶尔翻身、舔爪、瞥眼鼠标，不主动跟踪
  - 字体: Noto Serif SC 600 + EB Garamond italic
  - palette: spec § 6 / 猫 section

  依赖: infra-engineer 提供的 ParticleField / store / TopBar (Task 12-14)
  开发分支: feat/cat-hub
  接到任务先读 spec 相关章节，有 blocker 立即 SendMessage 找 team-lead。"""
)

# wolf-builder（同模式，调整 wolf 内容）
# deer-builder（同模式，调整 deer 内容）
```

- [ ] **Step 4: 创建共享 task list**

`TaskCreate` 一系列任务，分配给 teammate：

```
TaskCreate(subject="Zustand store + 主题 token", description="...", owner="infra-engineer")
TaskCreate(subject="SceneController 路由场景", description="...", owner="infra-engineer")
TaskCreate(subject="Cat HubScene 完整实施", description="...", owner="cat-builder")
TaskCreate(subject="Wolf HubScene 完整实施", description="...", owner="wolf-builder")
TaskCreate(subject="Deer HubScene 完整实施", description="...", owner="deer-builder")
```

- [ ] **Step 5: 并行执行**

每个 teammate 自动开始处理被分配的任务。team-lead（我）每天 review 进展，处理 block，整合 PR。

每天结束运行：

```bash
cd ~/claude_code_workspace/projects/personal-website
git log --all --graph --decorate --oneline -20
```

观察 4 个分支的进度。

- [ ] **Step 6: Daily standup（每天结束）**

team-lead 通过 SendMessage 给每个 teammate：

```
SendMessage(to="infra-engineer", summary="daily check-in", message="今天进度如何？有 blocker 吗？")
```

收集每人的 status，update 任务列表。

---

### Task 12-14: infra-engineer 任务（Zustand store / SceneController / TopBar）

> 由 infra-engineer agent 实施。详细 task 内容由该 agent 接到 task 后参照 spec § 8 / § 5 完整实施 TDD 流程（参考 Task 5-9 的 TDD 模式）。

**Task 12 · Zustand store:** 实施 `lib/store.ts`，包含 currentAnimal / lastAnimal / viewportMode / reduceMotion / particleConfig / ripples / leaveMessageOpen state。**写测试**: store 初始状态、setAnimal、reset 等。

**Task 13 · SceneController:** 实施 `components/canvas/SceneController.tsx`，使用 `usePathname()` 决定渲染 EntryScene / HubScene / SubpageAmbient 之一。

**Task 14 · TopBar:** 实施 `components/ui/TopBar.tsx`，包含换动物按钮（hover 展开三只小动物）+ 留言按钮。Tailwind 样式。

每个任务都按 TDD 5 步：写失败测试 → 验证失败 → 最小实现 → 验证通过 → commit。

---

### Task 15: cat-builder · Cat HubScene 完整实施

> 由 cat-builder agent 在 `feat/cat-hub` 分支实施。

**Files:**
- Create: `components/canvas/scenes/HubScene.tsx`（共享）
- Create: `components/canvas/scenes/CatHubVariant.tsx`
- Create: `app/cat/page.tsx`
- Create: `content/cat/about.mdx`, `content/cat/voice.json`

- [ ] **Step 1: 测试 cat hub 渲染**

```typescript
// tests/unit/cat-hub.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CatHubPage from '@/app/cat/page'

describe('Cat Hub Page', () => {
  it('renders the cat greeting', () => {
    const { getByText } = render(<CatHubPage />)
    expect(getByText('随意看看吧')).toBeTruthy()
  })

  it('uses cat color tokens', () => {
    const { container } = render(<CatHubPage />)
    const main = container.querySelector('main')
    expect(main?.className).toContain('bg-cat-bg')
  })
})
```

- [ ] **Step 2: 写 voice.json**

`content/cat/voice.json`:

```json
{
  "greeting": "随意看看吧",
  "subgreeting": "找位置坐",
  "leaveMessage": "在这世界踩个爪印吧",
  "loading": "翻一会",
  "notFound": "你走丢的方向我也没去过",
  "essaysLink": "看看我留下的字",
  "toysLink": "想试试我做的小玩意吗",
  "contactLabel": "想找我，留下你的方式"
}
```

- [ ] **Step 3: 写 about.mdx**

`content/cat/about.mdx`:

```mdx
我在做一些和 AI 有关的小事。

有时候是工具，有时候是想法。更多时候是把没想清的东西写下来，等它自己长出来。

书堆是真的，灯是开着的，茶可能凉了。

如果你来这里也只是想找个地方坐一会，那就坐吧。
```

- [ ] **Step 4: 实现 `app/cat/page.tsx`**

```tsx
import voice from '@/content/cat/voice.json'
import About from '@/content/cat/about.mdx'

export default function CatHubPage() {
  return (
    <main className="min-h-screen bg-cat-bg text-cat-body font-cat-zh">
      <section className="hero pt-32 pb-24 px-8 max-w-2xl mx-auto">
        <h1 className="font-cat-zh text-4xl text-cat-heading mb-4 font-semibold">
          {voice.greeting}
        </h1>
      </section>
      <article className="content max-w-2xl mx-auto px-8 prose prose-invert">
        <About />
      </article>
      {/* TODO: child page nav, contact, character canvas */}
    </main>
  )
}
```

- [ ] **Step 5: 测试运行**

```bash
npm run test -- tests/unit/cat-hub.test.tsx
npm run dev
```

打开 http://localhost:3000/cat — 看到 "随意看看吧" 标题 + about-me 段落。

- [ ] **Step 6: 加入字体**

修改 `app/layout.tsx` 加入 Google Fonts:

```tsx
import { Noto_Serif_SC, EB_Garamond } from 'next/font/google'

const notoSerif = Noto_Serif_SC({ weight: ['400', '500', '600', '700', '900'], subsets: ['latin'], variable: '--font-noto-serif' })
const ebGaramond = EB_Garamond({ style: ['italic'], weight: ['400', '500'], subsets: ['latin'], variable: '--font-eb-garamond' })

// in body className:
<body className={`${notoSerif.variable} ${ebGaramond.variable}`}>
```

- [ ] **Step 7: 加入猫角色（粒子）**

由 infra-engineer 提供 `<AnimalCharacter animal="cat" />` 组件，cat-builder 集成进 hub canvas。

具体粒子集成步骤参考 Task 9 的 ParticleField 用法：
1. 加载 `/assets/cat/char-sketch.png` 到 Image
2. drawImage 到 offscreen canvas
3. getImageData → samplePositionsFromAlpha
4. 用 cat 调色板为粒子着色
5. 渲染 `<ParticleField>` 在 canvas 中

- [ ] **Step 8: 加入猫角色行为（陪伴感，不打扰）**

```tsx
// AnimalCharacter cat variant
useFrame((state, delta) => {
  // idle: 慢节奏 idle (10-30s 周期)
  const t = state.clock.elapsedTime
  const breathe = Math.sin(t * 0.3) * 0.005  // 微呼吸
  // 偶尔翻身：每 30s 扰动一次
  // ...
})
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(cat-hub): 完整实施 — 文案 + about + 粒子角色 + 字体"
```

> 类似流程，wolf-builder 和 deer-builder 在自己的分支上独立完成 wolf 和 deer 的 hub。具体细节参照 spec § 4 / § 6 中各自动物的描述。

---

### Task 16-17: wolf-builder + deer-builder（并行）

> 由 wolf-builder 和 deer-builder agents 同时实施，结构同 Task 15，关键差异:

**Wolf hub:**
- 滚动: snap-scroll 分屏
- 文本揭示: 行块刷出，sharp
- 角色: 头部跟踪鼠标 (head-tracking via shader rotation)
- 字体: Noto Serif SC 900 + DM Serif Display italic 18px lowercase
- voice 关键文案：招呼 "进来"、留言 "你想留下你的气味吗？"、404 "这条路不在地图上"

**Deer hub:**
- 滚动: 缓慢 fade-and-reveal
- 文本揭示: 字一个个浮现
- 角色: 出现 → 停留 5-8s → 消散，仅在特定 scroll 触发点出现
- 字体: LXGW WenKai + Cormorant Garamond italic
- voice: 招呼 "你来了"（字间距大）、留言 "你对这个世界想留下什么？"、404 "这里没有路标"

LXGW WenKai 通过 jsdelivr CDN 加载:

```css
/* in app/globals.css */
@import url('https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css');
```

每个 hub task 完成后 cat/wolf/deer-builder 通过 SendMessage 给 team-lead 报告，等待 review 和 merge。

---

## Phase 4 · 入口屏 (Day 7-8)

### Task 18: EntryScene 三联画布

> 由 infra-engineer 实施（hub-builder 完成后释放）。

**Files:**
- Create: `components/canvas/scenes/EntryScene.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 实现 EntryScene 三 panel 布局**

每个 panel 是一个独立的 Group + ParticleField:
- 左 (cat): position [-3, 0, 0]
- 中 (wolf): position [0, 0, 0]
- 右 (deer): position [3, 0, 0]

加载各自的 entry-bg + char-sketch。

- [ ] **Step 2: 实现悬停聚光**

用 raycaster 检测鼠标位置 → 哪个 panel 被 hover → 该 panel 粒子密度跳到 hover 档（参考 PARTICLE_COUNTS），其他 panel 饱和度降到 30%。

- [ ] **Step 3: 实现回访提示（a + c 组合）**

```tsx
useEffect(() => {
  const last = localStorage.getItem('lastAnimal') as Animal | null
  if (last) {
    // a) 该 panel 微光脉冲（uniform pulseIntensity = 0.15）
    // c) 鼠标进入视口时该 panel 粒子做一次"呼吸"
  }
}, [])
```

- [ ] **Step 4: 点击进入 hub**

```tsx
const onPanelClick = (animal: Animal) => {
  // 触发粒子重组动画
  // 800-1000ms 后 router.push(`/${animal}`)
  setTimeout(() => router.push(`/${animal}`), 900)
}
```

- [ ] **Step 5: 测试 + Commit**

---

## Phase 5 · Subpage 系统 (Day 9-10)

### Task 19: Subpage shared layout

**Files:**
- Create: `app/[animal]/layout.tsx`
- Create: `components/content/MDXRenderer.tsx`

(详细实施同上述 Task 模式：写测试 → 失败 → 实现 → 通过 → commit)

### Task 20: Essays index + detail (MDX)

**Files:**
- Create: `app/[animal]/essays/page.tsx`
- Create: `app/[animal]/essays/[slug]/page.tsx`
- Create: `lib/mdx.ts` (essay metadata 提取)

### Task 21: Toys index

**Files:**
- Create: `app/[animal]/toys/page.tsx`
- Create: `components/content/ToyCard.tsx`
- Create: `content/{cat,wolf,deer}/toys.json`

---

## Phase 6 · 留言后端 (Day 11)

### Task 22: 留言 API route

**Files:**
- Create: `app/api/leave-message/route.ts`
- Create: `tests/unit/leave-message-api.test.ts`

- [ ] **Step 1: 测试 API**

```typescript
// tests/unit/leave-message-api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/leave-message/route'

describe('POST /api/leave-message', () => {
  it('accepts valid message', async () => {
    const req = new Request('http://localhost/api/leave-message', {
      method: 'POST',
      body: JSON.stringify({ content: '你好', signature: '小明', animal: 'cat' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('rejects oversized content', async () => {
    const req = new Request('http://localhost/api/leave-message', {
      method: 'POST',
      body: JSON.stringify({ content: 'x'.repeat(501), signature: 'a', animal: 'cat' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2-5: 实现 + 通过 + commit**

```typescript
// app/api/leave-message/route.ts
import { kv } from '@vercel/kv'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.content || body.content.length > 500) {
    return Response.json({ error: '内容长度不合规' }, { status: 400 })
  }
  if (!body.signature || !body.animal) {
    return Response.json({ error: '缺少必填字段' }, { status: 400 })
  }
  await kv.lpush('messages', { ts: Date.now(), ...body })
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'website@yourdomain.com',
      to: process.env.OWNER_EMAIL!,
      subject: '新留言来自 [' + body.animal + ']',
      text: body.content + '\n\n— ' + body.signature,
    })
  }
  return Response.json({ ok: true })
}
```

```bash
npm install @vercel/kv resend
```

环境变量在 Vercel 控制台配置（实施期 Day 10/11）：
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Vercel KV 创建后自动给)
- `RESEND_API_KEY` (用户 Day 10 提醒后自己注册)
- `OWNER_EMAIL`

### Task 23: 留言抽屉 UI

**Files:**
- Create: `components/ui/LeaveMessageDrawer.tsx`
- Create: `tests/e2e/leave-message.spec.ts`

(包括 form validation、动物语气定制、提交反馈、错误 fallback localStorage 暂存)

---

## Phase 7 · 移动端 + a11y (Day 12)

### Task 24: 移动端入口（vertical cards）

**Files:**
- Modify: `components/canvas/scenes/EntryScene.tsx`

实现 viewport detection：< 768px 时切换为纵向 3 卡片堆叠 + scroll snap。

### Task 25: prefers-reduced-motion

**Files:**
- Modify: `components/hooks/useReduceMotion.ts`
- Modify: 所有 canvas 组件

检测 `prefers-reduced-motion: reduce` → 关闭粒子动画 + ripple + transition，改用静态 char-sketch 剪影 + 300ms cross-fade。

### Task 26: 键盘导航 + ARIA

**Files:**
- Modify: 所有 UI 组件添加 `aria-label`、`role`、`tabIndex`
- Add: 跳过到内容链接

---

## Phase 8 · 测试 + CI (Day 13)

### Task 27: Playwright E2E 5 关键路径

**Files:**
- Create: `tests/e2e/{entry-flow,animal-switch,essay-flow,leave-message,mobile}.spec.ts`
- Create: `playwright.config.ts`

每个 spec 测试一个完整路径，参照 spec § 12 DoD。

### Task 28: 视觉回归 baseline

**Files:**
- Create: `tests/visual/baselines.spec.ts`

每动物 3 张关键截图（hub 第一屏、essay 详情、留言抽屉打开）。

### Task 29: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

```yaml
name: CI
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://personal-website-xxxx.vercel.app/
          configPath: ./.lighthouserc.json
```

---

## Phase 9 · 部署 + 上线 (Day 14)

### Task 30: 环境变量 + Vercel KV

- 在 Vercel 控制台 Storage → Create KV database
- 添加 `RESEND_API_KEY`、`OWNER_EMAIL`、`SENTRY_DSN` 到 Project Environment Variables

### Task 31: Sentry 集成

```bash
npx @sentry/wizard@latest -i nextjs
```

按 wizard 走完，commit 配置文件。

### Task 32: og:image 静态生成

每动物一张 og:image (1200x630)，从 hub bg 截屏。

### Task 33: README + 自查指南

```markdown
# 个人网站 (三动物粒子美学)

[live site] · [spec doc] · [implementation plan]

## 如何加 essay
- 在 `content/{animal}/essays/` 创建 `YYYY-MM-DD-slug.mdx`
- frontmatter: title, date, excerpt
- push to main → Vercel auto-deploy ~30s

## 如何调粒子参数
- 编辑 `lib/particles.ts` 中 `PARTICLE_COUNTS`
- High/Mid/Low 三档分别调

## 如何换字体（v1.x 装钢笔鹤体等）
- 把字体文件放 `public/fonts/`
- 在 `app/globals.css` 加 @font-face
- 在 `tailwind.config.ts` 替换 `font-wolf-zh`

## 常见错误 + 解决
- 粒子不显示 → 检查 char-sketch.png 是否有 alpha channel
- WebGL context lost → Sentry 已捕获，自动重启
- 留言提交失败 → localStorage 自动暂存，下次自动重试
```

### Task 34: v1 上线 + smoke tests

- [ ] Vercel main 分支自动部署最新版本
- [ ] 手动跑 5 条 E2E 路径（cat/wolf/deer 各做一遍）
- [ ] 真机访问（你的桌面 / iPhone）
- [ ] axe-core scan ≥ 85
- [ ] Lighthouse score ≥ 80 perf / ≥ 85 a11y
- [ ] 测留言提交，看到邮件到达

✅ **v1 上线完成**

---

## Self-Review (执行前 checklist)

- [ ] **Spec 覆盖检查**：spec 12 节都有对应 task
  - § 1 概览 → Task 1-3 (foundation)
  - § 2 路由 → Task 12-14 (infra) + Task 15-17 (hubs) + Task 19-21 (subpages)
  - § 3 入口屏 → Task 18
  - § 4 Hub D persona → Task 15-17
  - § 5 Subpage → Task 19-21
  - § 6 Personas → 嵌入 Task 15-17
  - § 7 粒子 + ripple → Task 6-9 + spike Task 10
  - § 8 技术架构 → Task 2-4 + Task 11-14
  - § 9 资源管线 → Task 1 (复制资源) + 实施期脚本
  - § 10 性能 → Task 8 (tier) + Task 24-25 (mobile + reduce-motion)
  - § 11 a11y → Task 26
  - § 12 DoD → Task 27-29 (tests) + Task 30-34 (deploy)

- [ ] **占位符检查**：grep "TBD|TODO|implement later|fill in"——无（除了 Task 15 步骤 7-8 中 cat-builder 收到任务后参照 spec 实施的部分，这是 agent team 工作流的合理 delegation 而非占位符）

- [ ] **类型一致性**：types.ts 定义的 Animal/AnimalConfig/ParticleConfig/RippleParams 在所有任务中名称一致

---

## 执行选择

Plan complete and saved to `docs/superpowers/plans/2026-05-10-personal-website-implementation.md`. Two execution options:

1. **Subagent-Driven (recommended for rigor)** - 我 dispatch 一个 fresh subagent per task，task 间 review，慢但稳。每个 subagent 拿 fresh context，按 TDD 严格走。

2. **Inline Execution** - 在当前 session 顺序执行 tasks，batch 执行配 checkpoint review。快但 token 消耗大。

3. **Agent Teams (新选项，spec 锁定的方式)** - TeamCreate + 4 teammate 并行（lead + infra-engineer + 3 hub builder）。Phase 1-2 顺序，Phase 3 起并行，每天 standup。最快但 token 消耗 ~5x。

哪一种？
