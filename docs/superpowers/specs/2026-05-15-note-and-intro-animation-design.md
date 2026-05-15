# Hub 便签 + 主区域 quote + 入场过渡动画 · 设计 spec

**日期**：2026-05-15
**作者**：brainstorm with claude
**主 spec**：`docs/superpowers/specs/2026-05-10-personal-website-design.md`
**关系**：本 spec 是主 spec 的延伸，覆盖 hub 三个新增 / 修订模块。冲突时以本 spec 为准。

## 0 · 摘要

主 spec § 4 hub 的内容布局做两处结构调整 + 一处新增动画：

1. **新增便签**：左上角小便签纸，承担"我是谁 / 在做什么"的人格信息（hover 展开）
2. **修订主区域**：原 about-me 文学描写换成经典文学引用，每次访问随机轮转
3. **新增入场动画**：粒子从入口三联屏续起到 hub 最终位置；无入口时以墨晕方式 fallback

---

## 1 · 便签（hub 左侧固定位）

### 1.1 形态

- 位置：左上角，距 viewport 左 32px 顶 100px
- 视觉：纸色矩形 ~180×120px，rotate -3°，box-shadow `4px 6px 12px rgba(0,0,0,0.5)`
- 字体：等同 hub 主字体（cat=Noto Serif SC + EB Garamond italic 等），具体字号见 § 1.2 / 1.3
- 每动物 palette 变体：
  - cat：纸色 `#f4e6c8` 字色 `#3a2818`
  - wolf：纸色 `#d8dde4` 字色 `#1c2530`
  - deer：纸色 `#ece8dd` 字色 `#403828`

### 1.2 默认显示

```
— note —
llr
a corner for AI tinkering
hover to read more →
```

- 第一行 `— note —`：12px 字距 0.08em 灰色 0.55 opacity
- 第二行 `llr`：13-14px 加粗
- 第三行 tagline：11px italic 0.8 opacity
- 第四行提示：9px 0.4 opacity

### 1.3 hover 展开

hover / focus 时浮层向右滑出（width 280px，duration 250ms，easeOutCubic），显示：

```
llr · ireneegofly
在 anthropic 做 dev tools

我在做一些和 AI 有关的小事。
有时候是工具，有时候是想法，
更多时候是把没想清楚的东西写下来——
等它自己长出来。

2026 春 · 上海
email · github
```

- 浮层背景同便签纸色，shadow 加深
- 离开 hover 200ms 后收回
- 键盘 `Tab` focus 等价于 hover；`Esc` 收回

### 1.4 a11y

- 便签整体是 `<button>` 或带 `role="button"` 的 div，支持 keyboard focus
- 浮层内容用 `aria-expanded` 状态
- 默认显示对话内容（避免屏幕阅读器跳过）

### 1.5 与入场动画的关系

便签整体 opacity 由 `introTextAlpha`（§ 3.4）控制，与 quote、署名、TopBar、nav 同步淡入。便签内 hover 展开行为本身不受入场动画影响（用户在动画进行中也可触发）。

---

## 2 · 主区域 quote 轮转（替换原 about-me）

### 2.1 内容

原主 spec § 4 hub 主体那段散文（"我在做一些和 AI 有关的小事…"）从主区域**移除**，作为便签 hover 展开的内容（见 § 1.3）。

主区域替换为**经典文学引用轮转**。

### 2.2 数据结构

每动物 `content/<animal>/quotes.json`：

```json
[
  {
    "text": "吾辈是猫，名字尚无。",
    "author": "夏目漱石",
    "work": "《我是猫》",
    "translator": "刘振瀛"
  },
  ...
]
```

每动物 5 句。`text` 是显示文本，`author`/`work` 用于署名。`translator` 仅中文译文版本需要（中文原创作品省略）。

### 2.3 候选作家方向（实施期填具体引文）

| 动物 | 语言 | 候选作家（5 位） |
|---|---|---|
| 猫 | 中文 | 夏目漱石、老舍、周作人、博尔赫斯（中译）、张爱玲 |
| 狼 | 英文原文 | Jack London、Mary Oliver、Aldo Leopold、Robert Frost、Hermann Hesse |
| 鹿 | 中文 | 王维、川端康成、沈从文、木心、韦应物 |

### 2.4 轮转规则

- hub mount 时 `Math.floor(Math.random() * 5)` 取 index
- 不去重连续访问（接受同句概率 20%）
- 不用 sessionStorage 避免污染

### 2.5 呈现

- 标题 hero 改为该句 quote（hero 不再是 "随意看看吧"）
- quote 字号、字体跟主 spec 既定的 hub 主字体一致
- 署名格式：`— 作者名 · 《作品》`，比 quote 小一档，0.6 opacity
- 中文译文版本：署名末尾 `（译者）` 灰字
- 排版：quote 居左 max-width 36rem，署名右对齐

### 2.6 与入场动画的协同

quote 文本块跟随入场动画 opacity 曲线淡入（见 § 3.4）。粒子先动起来，文字滞后 0.3s 开始 fade，1.6s 时全亮。

---

## 3 · 入场过渡动画

### 3.1 触发条件

- **触发**：hub 路由首次 mount + 刷新 reload + 从入口跳转
- **跳过**：从同动物子页（`/cat/essays`、`/cat/toys`）返回 hub 时
- **a11y 跳过**：`prefers-reduced-motion: reduce`

实现：

```typescript
// store
sessionStorage.getItem('skipIntro') === 'true'
// /cat/essays 跳转回 /cat 前 set
sessionStorage.setItem('skipIntro', 'true')
// hub mount 后清掉
sessionStorage.removeItem('skipIntro')
```

### 3.2 双路径

入场动画有两套路径，根据上下文选择：

#### D 路径 · 入口续起（首选）

- **何时**：从入口三联屏（`/`）选完动物跳转到 hub 时
- **机制**：入口页面板里那只动物的粒子结束位置存到 Zustand `useStore.introState`，hub mount 读取，每个粒子的起始位置 = 对应入口位置（经 viewport-coord → hub world-coord 变换）
- **依赖**：入口三联屏（主 spec § 3 / Task 18）必须先存在并使用同样的 char-sketch 采样

#### C 路径 · 墨晕 fallback

- **何时**：直接 URL（`/cat` 不经入口）、刷新、入口未上线时
- **机制**：每个粒子起始位置 = `origin + jitter`，jitter 是高斯随机偏移（`σ = 0.6` 世界单位），lerp 回 origin

### 3.3 节奏（每动物 vibe 差异）

| 动物 | 时长 | easing | 解释 |
|---|---|---|---|
| 猫 | 1.8s | easeOutQuart | 慵懒 |
| 狼 | 1.2s | easeOutQuart | 警觉 |
| 鹿 | 2.0s | easeOutQuart | 飘逸 |

`easeOutQuart`: `1 - (1 - t)^4`

### 3.4 Opacity 曲线

粒子 alpha 在 vertex shader 里乘 `uIntroAlpha` uniform：

- t ∈ [0, 0.3s]：α = 0.15（雾态）
- t ∈ [0.3s, duration]：α = lerp(0.15, 1.0, easeOutQuart((t - 0.3) / (duration - 0.3)))

> 用同一个 easeOutQuart 与位置 lerp 一致，简化实现。视觉差异肉眼不可见。

文字 quote / 便签 / TopBar / nav 共享同一 `introTextAlpha`：

- t ∈ [0, 0.3s]：α = 0
- t ∈ [0.3s, duration]：α = (t - 0.3) / (duration - 0.3)

### 3.5 实现细节

新增 `useIntroAnimation` hook：

```typescript
function useIntroAnimation(animal: Animal): { particleAlpha: number; textAlpha: number; particleProgress: number }
```

`AnimalCharacter` 在 useFrame 里：

- 如果 `progress < 1`：粒子位置 = lerp(introStart, origin, easeOutQuart(progress))
- 如果 `progress >= 1`：常态（呼吸 + ripple）

### 3.6 reduce-motion 跳过

`useSiteStore.reduceMotion = true` 时：

- `useIntroAnimation` 返回 `{ particleAlpha: 1, textAlpha: 1, particleProgress: 1 }`
- 粒子位置直接 = origin
- 不触发 useFrame 入场逻辑

---

## 4 · 阶段交付

### 4.1 现阶段（cat hub 完善）

需要做的：
- 便签组件 `<NoteTag animal="cat" />`，含 hover 展开
- `content/cat/quotes.json` 5 句中文引用
- 主区域改造：hero 显示当前 quote、署名、main body 文学描写从 about.mdx 移走
- `useIntroAnimation` hook
- `AnimalCharacter` 接入 `introStart`（fallback 模式：jitter origin）+ progress
- TopBar、quote、note 共用 `introTextAlpha` 控制 opacity

入口三联屏未上线，全部走 C 墨晕 fallback。

### 4.2 入口三联屏上线后（Task 18 配套）

需要做的：
- 入口页 panel mount 时计算每动物粒子在 viewport 中的最终位置，存 `introState`（viewport coords + scale）
- hub mount 读取 `introState`，转换为 hub world coords 作为粒子起始位置
- 状态消费一次后清除

D 路径上线，C fallback 保留（处理直接 URL / 刷新场景）。

---

## 5 · 与主 spec 的差异点

| 模块 | 主 spec § | 本 spec 改动 |
|---|---|---|
| Hub 主区域 about-me | § 4 hub layout | 文学散文改成经典引用轮转 + 序号 1-5 |
| 左侧固定位 | （未定义） | 新增便签纸（§ 1） |
| 入场动画 | § 7 粒子系统 | 新增过渡动画 D 主 + C fallback（§ 3） |
| sessionStorage skipIntro | （未定义） | 子页返回 hub 时跳过动画的状态钥匙 |

其余维度（粒子档位、ripple、字体、对比度路线等）**不变**，沿用主 spec。

---

## 6 · 待 implementation plan 决定的细节

不属于设计决策范围，由 plan 阶段拍板：

- 便签组件文件路径：`components/ui/NoteTag.tsx` 还是 `components/animal/NoteTag.tsx`
- `useIntroAnimation` 放在哪个目录
- quotes.json 是 import 还是 fetch
- 入口三联屏 introState 的精确数据 schema（v0 占位，Task 18 实施时细化）
