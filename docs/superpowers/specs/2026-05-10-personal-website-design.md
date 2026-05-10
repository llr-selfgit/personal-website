---
title: 个人网站设计 — 三动物粒子美学
date: 2026-05-10
status: design-draft
author: 主人 + Claude Code
---

# 概要

一个带"作品感"的个人网站。访客进入时看到一幅**横向三联画**——猫世界（暖书房）、狼世界（冷月夜山脊）、鹿世界（雾晨溪边）。三只动物以粒子化剪影出现在各自的世界中，访客悬停聚光、点击进入。

进入某只动物的 hub 后，访客所处的**视觉、文案语气、布局节奏、交互密度**都按该动物的 persona 完全定制（D 级 persona）。Hub 是 about-me 的载体；从这里分支到 essays（随笔）和 toys（AI 小玩意）两个子页（B 级 persona——保留视觉 + 语气，统一 layout）。

技术上单 R3F Canvas 跨路由持续运行，粒子在路由切换时重组而非重建。鼠标涟漪以**多 ring 同心扩散**模拟水波。

工作量：使用 Claude Code Agent Teams 并行实施，**2-3 周** v1 上线。

---

# § 1 · 概览与边界

## 我们在做什么

一个个人网站。访客流程：

1. 落地 `/` → 横向三联场景（猫 / 狼 / 鹿，边界以墨晕融合）
2. 悬停某只动物 → 聚光 + 粒子聚拢 + 其他世界褪色
3. 点击 → 粒子重组转场 → 进该动物 hub
4. Hub 是 about-me 主体（D 级 persona 完整呈现）
5. 从 hub 可去 `/[animal]/essays` 和 `/[animal]/toys`（subpage，B 级 persona）
6. 任意页可触发"留言抽屉"（私信，仅你可见）
7. 任意页右上角"换动物"按钮回到入口

## 目标

1. **第一印象 = 签名**：入口屏 + 选择仪式是这个网站的辨识度核心
2. **选择即表态**：三只动物性格反差大到访客的选择本身有情绪
3. **"像画的，不像生成的"**：高密度粒子（50K-80K）让粒子元素质感接近手绘
4. **能轻松增量更新**：往 essays / toys 加内容时不需要碰核心代码

## 非目标 (v1)

- 多语言（v1 仅中文，英文版进 v1.x）
- 网页内编辑器（路径 2 进 v1.x，v1 仅 git push）
- 全部 10 只动物（v1 仅 3 只）
- iPhone SE 等低端机
- 移动端与桌面端体验对等（移动端是简化版）
- SEO 深度优化（个人站次要）

## 受众

- **主要**：从私信 / 邮件 / profile bio 链接进来的人（朋友、潜在合作方）
- **次要**：偶然访问、AI 同行
- **不优化**：搜索引擎流量

## 成功标准（主观）

- 访客在 30 秒内能说出"哪只动物的世界让我想留下来"，且能说出原因
- 截一帧画面，能让别人认出"这是 [你] 的网站"
- 在 4 年内的中端笔记本上 ≥ 30fps，iPhone 12 不崩

## 双语策略

v1 仅中文。markup 留好 i18n 接口（`<html lang="zh-CN">`），v1.x 再加英文版（路由用 `/en/...`）。

## 留言系统形态

**A 路线 · 私信投递**：访客可写不可读，留言只到你邮箱 / Vercel KV 控制台。
- 抽屉触发于任意 hub / subpage
- 字段：内容（必填，500 字限）、署名（三选一：自填名字 / 自填身份 / "我是只 [当前动物]"）
- 提交 → POST `/api/leave-message` → Vercel KV 存储 + Resend 邮件通知

---

# § 2 · 信息架构与路由

## 路由树

```
/                          入口屏（三联场景）
/cat /wolf /deer           动物 hub（3 个）
/cat/essays  /wolf/essays  /deer/essays                随笔列表
/cat/essays/:slug 等        随笔详情
/cat/toys  /wolf/toys  /deer/toys                      AI 小玩意
/api/leave-message         留言 POST 端点
```

3 动物 × 4 路由 + 入口 + API = **14 个路由**。

## 导航 / 切换

每页（hub + subpage）右上角小区域：
- **换动物** 按钮（icon-only，hover 展开三只小动物图标）。点击 → 入口屏
- v1 不放语言开关（中文 only，v1.x 加）

Hub 内主导航：分支到 `essays` / `toys` / contact 区块（contact 不单独成页，hub 底部内嵌）

Subpage 内导航：左上角"← 回 [动物] 的家"

## 持久化（localStorage）

记住：上次选的动物 + 语言（v1 都是 zh-CN，不可见但留接口）。

**入口屏永远是 `/` 的第一帧**——下次访客访问，仍然先看到三世界场景，不直接跳过。仪式感不能省。

**回访提示（a + c 组合）**：
- 页面加载完成：上次选过的动物剪影自带 **15% 强度的微光脉冲**（缓慢 4s 周期）
- 鼠标进入视口的瞬间：该面板的粒子做一次"呼吸"——向外缓慢扩散一波再收回（持续 600ms）
- 无文字提示

## 留言流程

任意 hub / subpage 可触发"留言抽屉"。

字段（动物语气定制）：
- 留言内容（必填，纯文本，500 字限）
- 署名（必填，三选一）：
  1. 自填名字
  2. 自填身份
  3. "我是一只 [当前动物]"（自动带）

提交 → POST `/api/leave-message` → 写入 **Vercel KV**（免费层）+ **Resend 邮件通知**到你的邮箱。

访客只看到"已送达"反馈。所有留言只在你的邮箱 / Vercel KV 控制台可见。

抽屉底部隐私脚注："你的留言只有 [你的名字] 能看到，不会公开展示"。

## Contact 区块（hub 底部）

两块：
- **直接联系**：邮箱 / GitHub / 一行外部链接
- **留个口信**：触发留言抽屉

## v1 不做（v1.x 候选）

- 留言后台 admin UI（邮件 + KV 控制台够用）
- 邮件回复链路、邮件模板美化
- 语言切换时的 URL 自动重定向
- robots.txt / sitemap

---

# § 3 · 入口屏体验

## 布局结构 · 三联横屏

全视口宽。三个面板等宽，边界以**墨晕 + 雾**融合（无硬线）。每个面板的色温、构图、氛围：

| 面板 | 主题 | 主色温 | 动物在哪 |
|---|---|---|---|
| 左 / 猫世界 | 暖色书房 | 暖琥珀 `#3a2a1c → #0f0a06` | 前景树桩 / 窗台 / 书堆，慵懒蜷着 |
| 中 / 狼世界 | 月夜山脊 | 冷蓝灰 `#0f1822 → #0a0f15` | 中景剪影，静止凝望 |
| 右 / 鹿世界 | 雾晨溪边 | 雾绿米色 `#1f2018 → #0f120a` | 远景，半透在雾里 |

## 三种状态

**Idle（无悬停）**：
- 三只动物以**低密度粒子**（每只 ~3000 颗）轻微 idle 动作（呼吸 / 毛发飘动）
- 没有 spotlight，三个世界亮度均等

**Hover（悬停某面板）**：
- 该面板的粒子密度**跃升到 50K-70K**（按设备 tier） → 形态聚拢 → 看起来像画出来
- 该面板饱和度↑，其他两个褪色（saturation 降到 30%）
- **粒子吸引效应**：相邻面板里的粒子向 hover 的那只动物**轻微飘动**（强化"它在召唤"的感觉）
- 该动物的世界 vignette 微微拉强

**Click（确认进入）**：
- 该动物的粒子炸开 + 重组为 hub 形态
- 同时面板"撑开"占据全屏，其他两个面板的内容粒子化消散
- 这个过渡是 R3F **单 canvas 持续**的，无白屏 / 无 page reload
- 时长 **800-1000ms**，节奏：100ms 收紧 → 400ms 重组 → 400ms 扩展

## 文案区域

- 屏幕顶部偏左：你的姓名 / handle，细体小字
- 屏幕底部居中：引导文字（候选 "悬停 — 选择 — 进入" / "三种状态，选一种"）
- 仅在 idle 状态显示，hover/click 时淡出

## 鼠标拖尾

入口屏的鼠标 ripple 强度**比 hub 内弱**——细节进 § 7。这里只需知道"入口有 ripple，但不抢戏"。

## 移动端入口

三联横屏在手机上行不通。降级方案：

- **3 张全屏卡片纵向排列**，访客上下滑动切换
- 当前视口居中的卡片 = 当前 hover 状态（自动）
- 轻点进入该动物（无需先点亮再点确认，单击即入）
- 回访提示：localStorage 上次动物的卡片**默认滚动到首屏中央**

---

# § 4 · Hub 结构（D 级 persona）

## Hub 是什么

访客点击动物后进入的"主页面"。它是 about-me 的载体，但通过 D 级 persona 把"读 about" 这件事变成"待在这只动物的世界里"。

## 5 个内容槽位

每只动物的 hub 都包含这 5 个槽位，**每只动物对它们的呈现方式完全不同**：

| 槽位 | 内容 | 占空间 |
|---|---|---|
| **A · 世界画布** | 动物的 background painting + 粒子角色 + ambient | 全屏背景，永远在 |
| **B · 招呼语** | 短句，动物语气欢迎访客 | hero 区域 |
| **C · about-me 主体** | 关于我的 1-3 段文字，结合 1-2 处插画 / icon | 主滚动内容 |
| **D · 子页入口** | 通往 /essays /toys 的链接 / 引导 | 在主体之后或浮动 |
| **E · 底部 contact + 留言** | 邮箱 / GitHub / 留言抽屉触发 | 页底 |

## 不同动物的 D 级差异（结构层）

同样的 5 个槽位，三只动物的 layout / 揭示动效 / 字体节奏 / 角色行为完全不同：

| 维度 | 猫 hub | 狼 hub | 鹿 hub |
|---|---|---|---|
| **滚动机制** | 自由长滚（慢，留白大） | snap-scroll 分屏（每屏一节，干脆利落） | 缓慢 fade-and-reveal（不靠用户滚，靠时间和滚动节奏） |
| **文本揭示** | 段落整段淡入 + 缓慢 | 行块刷出，sharp | 字一个个浮现（像雾散开） |
| **字体节奏** | serif，行距 1.8，留白多 | sans semibold，行距 1.4，紧凑 | serif italic，行距 2.0，飘逸 |
| **角色行为** | 偶尔翻个身、舔爪 | 头部偏转跟踪鼠标、警觉 | 缓慢呼吸、偶尔抬头 |
| **导航交互** | hover 才浮现 nav，不主动暴露 | nav 一直在，干净显眼 | nav 隐含在画面里（如鹿的视线方向） |

## 角色在 Hub 中的位置和行为

D 级 persona 的核心载体就是这只角色。

### 猫 hub — 陪伴感（不打扰）
- **位置**：视口右下角偏内（约 18% 视口宽，书桌旁 / 窗台）
- **跟随滚动**：不跟随，`position: fixed`
- **行为**：慢节奏 idle（10-30s 周期）—— 偶尔翻身、伸懒腰、舔爪、瞥一眼鼠标
- **互动**：鼠标悬停 → 抬眼，最多伸个懒腰，不主动接近

### 狼 hub — 注视感（紧凑、活跃）
- **位置**：进 hub 时占据画面正中下方，巨大（占 60% 视口高）
- **跟随滚动**：随 scroll 平滑退场到右上角"瞭望点"，约 15% 大小，余下整个 session 都在"看着你"
- **行为**：头部 subtle 跟随鼠标，重心偶尔偏移，耳朵微动
- **互动**：鼠标快速移动时，狼短暂跟随后看回原方向；点击 nav 时身体起立 + 转向指向 subpage 方向

### 鹿 hub — 灵现感（来去有时）
- **位置**：不固定——在特定 scroll 触发点出现：hero、about 段末、子页入口前、contact 区
- **跟随滚动**：不跟随，每次"出现 → 停留 5-8s → 慢慢隐入雾中"
- **行为**：雾里浮现 → 抬头看向访客 → 低头继续 → 消散
- **互动**：鼠标靠近时它会更早消散（保持距离感）

## 鼠标 ripple 与角色的互动彩蛋

鼠标涟漪经过角色身上时：
- **猫**：粒子轻微震动 → "懒得理"
- **狼**：粒子追着 ripple **逆向偏移**一下 → 警觉
- **鹿**：粒子跟随 ripple **向外扩散** → 像"碰水的鹿群"

正是这种细节决定"你能不能感到这是只活着的动物"。

## Hub → Subpage 过渡

点击 nav 链接进入 /essays /toys 时：
- 角色姿态变化（如狼站起、鹿低头开始走）
- 世界画布部分褪色 / 远拉
- 持续 ~600ms，无白屏

---

# § 5 · Subpage 结构（B 级 persona）

## 总原则

Subpages 抛弃 D 级的"完全定制"，回到统一 layout。每只动物保留：
- **背景画**（hub 主背景的低饱和 / 模糊版，opacity 30%）
- **主色调 / accent color**（按钮、链接、引用块等的着色）
- **文案语气**（关键 CTA、空状态、loading、错误）
- **小尺寸 ambient 角色**

不再保留：
- 字体粗细 / 行距 / 留白比例
- 滚动机制
- 文本揭示动效
- 角色行为复杂度

## 共享 layout grid

```
┌───────────────────────────────────────┐
│ ← 回 [动物名] 的家       [换动物][留言] │ <- top bar (固定，48px)
├───────────────────────────────────────┤
│                                        │
│   [content max-width 720px, 居中]      │
│                                        │
│   typography:                          │
│     - body: serif 17px / 1.7           │
│     - h1: serif 32px / 1.3             │
│     - h2: serif 24px / 1.4             │
│     - code/inline: mono 15px           │
│                                        │
│   animal accent color:                 │
│     - 链接 underline                    │
│     - blockquote left border           │
│     - selection bg                     │
│                                        │
└───────────────────────────────────────┘
背景：低饱和度 hub 背景画（opacity 30%）
```

## /essays — 随笔列表

每篇一行（不是 card）：
- 标题（动物 accent 色，h2 大小）
- 日期 + 阅读时长（小字灰色）
- 首段截选（~80 字）
- 行间距 32px

v1 内容极简（0-3 篇），列表简洁清晰即可。10+ 篇时再考虑加 tag / 搜索。

## /essays/:slug — 随笔详情

- **顶部**：标题 + 日期 + 阅读时长
- **正文**：MDX 渲染（支持代码块、图片、blockquote、math）
- **底部**：上一篇 / 下一篇 + 回到列表 + 触发留言（动物语气文案）

## /toys — AI 小玩意

灵活的 card：

| 类型 | Card 内容 |
|---|---|
| **GitHub 项目** | 仓库标题 + 描述 + tech stack + 跳转 GitHub |
| **在线工具** | 截图 + 一句话简介 + "试一试 →" 跳转 |
| **嵌入式 demo** | iframe / 嵌入式 widget + 简介 |
| **艺术作品** | 大图 + 标题 + 简短说明 |

桌面 2 列 / 移动端 1 列。

## 子页内的 ambient 角色

按 § 4 末尾约定：
- 猫 → 右下角小猫缩略，固定 idle
- 狼 → 左上角小狼头剪影，不 head-tracking
- 鹿 → 仅在 essay 详情页**读完瞬间**底部浮现一次

## 鼠标 ripple 在 subpage

强度**减弱**（约 hub 的 50%），不在阅读长文时干扰。

---

# § 6 · 三只动物 Personas

## 🐱 猫 — 慵懒思考者

**核心一句话**：一只在书房里读着书 / 假装睡着 / 其实都听见了的猫。

| | |
|---|---|
| **Palette** | 主背景 `#2a1f15`（暗琥珀）/ 中景 `#3a2a1c`（暖胡桃）/ 高光 `#d4a574`（灯光黄）/ **accent** `#ff9d6b`（链接、按钮） |
| **世界** | 黄昏的书房一角。木地板、靠墙书架塞满书，旧毛毯铺在长椅上。半开窗外是模糊街景，黄铜台灯亮着，桌上散着翻开的书和茶杯。猫蜷在窗台或长椅上，眼睛半眯。 |
| **Voice 三关键词** | 慵懒、自嘲、克制 |
| **示例语气** | "随意看看吧" · "我把这些堆在一起好让我假装在做事" |
| **关键文案** | 招呼："随意看看吧" · 留言入口："在这世界踩个爪印吧" · Loading："翻一会" · 404："你走丢的方向我也没去过" |
| **角色形态** | 灰色短毛猫，侧睡（参考 char-cat.png）|
| **字体（hub）** | 中文：Noto Serif SC 600 / 英文 accent：EB Garamond italic |
| **AI Prompt 种子** | *A pencil sketch of a cozy reading nook at dusk, warm amber lamp light, wooden floor with rug, bookshelf, wooden bench under window, scattered open books and teacup. Loose ink hatching, soft shading. A grey shorthair cat curled on windowsill. Empty middle space for content. Sepia and warm grey tones, no color saturation. 16:9 widescreen.* |

## 🐺 狼 — 机敏战略家

**核心一句话**：一头站在山脊上望向远方的狼。安静地有能力，不戏剧。

| | |
|---|---|
| **Palette** | 主背景 `#0a0f15`（近黑蓝）/ 中景 `#0f1822`（深石板）/ 高光 `#6e8aa8`（月光蓝）/ **accent** `#4a8cc4`（冷蓝） |
| **世界** | 月夜山脊。前景岩石和散草，中景悬崖与远山剪影，远景低垂的月和稀薄云。狼站在山脊边缘，朝向远方。 |
| **Voice 三关键词** | 直接、克制、锐利 |
| **示例语气** | "进来，别站门口" · "这里没什么解释，看就是了" |
| **关键文案** | 招呼："进来" · 留言入口："你想留下你的气味吗？" · Loading："稍等" · 404："这条路不在地图上" |
| **角色形态** | 灰黑色狼，立姿，头颈线条紧绷，耳朵竖起 |
| **字体（hub）** | 中文：Noto Serif SC 900 / 英文 accent：DM Serif Display italic 18px lowercase（**v1 stand-in**）|
| **字体 v1.x 候选** | 钢笔鹤体 / 一点明朝 / 源云明体 SC subset（实施期定，本地装 + @font-face 嵌入） |
| **AI Prompt 种子** | *A pencil sketch of moonlit mountain ridge at night, sharp jagged cliffs midground, distant snow-capped peaks, low pale moon in cool slate sky. Loose hatching. A grey wolf standing on ridge edge in profile, gazing toward horizon, head level (NOT howling). Cool blue-grey tones, no saturation. 16:9 widescreen.* |

## 🦌 鹿 — 灵性见证者

**核心一句话**：一头在雾里若隐若现的鹿。它看着你，但不评价。

| | |
|---|---|
| **Palette** | 主背景 `#0f120a`（深林绿）/ 中景 `#1f2018`（苔石）/ 高光 `#c4baa0`（雾米色）/ **accent** `#8a9b73`（鼠尾草绿） |
| **世界** | 雾晨溪边。前景浅水流动反着微光，中景湿草地和苔石，远景雾里若隐若现的树。鹿在溪边低头喝水，半身在雾里，倒影在水中。 |
| **Voice 三关键词** | 安静、留白、不解释 |
| **示例语气** | "这里没人催你" · "停下来" · "(此处留白)" |
| **关键文案** | 招呼："你来了"（字间距大）· 留言入口："你对这个世界想留下什么？" · Loading："…" · 404："这里没有路标" |
| **角色形态** | 优雅修长，颈部修长，耳朵微动；常半身在雾里 |
| **字体（hub）** | 中文：LXGW WenKai（霞鹜文楷）/ 英文 accent：Cormorant Garamond italic |
| **AI Prompt 种子** | *A pencil sketch of misty dawn streamside, shallow water reflecting pre-dawn soft light, distant trees half-hidden in fog. Soft graphite hatching, ethereal mood. A graceful deer at water's edge, head slightly lowered drinking, half-disappeared into mist. Sage and beige tones, very low saturation. 16:9 widescreen.* |

## 装饰元素（per animal）

每只动物 3 个独立 PNG with alpha，作为 sprite 叠加：

### 🐱 猫
1. **散落的书堆** — 鼠标靠近时纸页轻微翻动；ripple 经过书页颤动
2. **茶杯 + 蒸汽** — 蒸汽跟随鼠标方向摆动
3. **毛线球** — hover 时轻微滚动；点击展开一段毛线

### 🐺 狼
1. **远山剪影** — 视差滚动（背景层），不响应鼠标
2. **飘落的松针** — 全屏缓慢 drift，鼠标经过被推开
3. **远处隐现的爪印** — 周期性出现 → 浅 → 消失（每 30s 一组）

### 🦌 鹿
1. **水面波纹** — 鼠标在水面区域 → 触发同心圆涟漪（ripple 强化版）
2. **漂浮的叶子** — 在水面缓慢漂；ripple 经过被推开
3. **流动雾气** — 全屏低密度雾粒子；鼠标经过雾被短暂吹散

---

# § 7 · 粒子与涟漪系统（视觉签名）

## 粒子系统

**渲染方式**：GPU instanced points（WebGL `gl.POINTS`）+ 自定义 vertex/fragment shader。每个粒子 1-3px 小色点。

**密度分级**（详见 § 10）：

| 场景 | High | Mid | Low |
|---|---|---|---|
| 入口 idle（每只动物） | 4,000 | 2,000 | 500 |
| 入口 hover（聚拢的那只） | 70,000 | 40,000 | 8,000 |
| Hub 角色 | 80,000 | 50,000 | 15,000 |
| Hub ambient 背景粒子 | 5,000 | 3,000 | 800 |
| Subpage ambient 角色 | 5,000-10,000 | 3,000 | 500 |

**"像画的"技术核心**：
- 粒子目标位置由**手绘背景图采样**（Nano Banana 出的素描 → 转为 SDF / alpha 采样图）
- 粒子颜色从**调色板纹理**采样（每只动物的 palette 喂进 1D texture）
- 粒子 size 在 `0.5px - 3px` 之间分布，越靠近角色边缘越小（模拟铅笔笔触渐隐）
- 抖动：每个粒子有 `noise(uv, time) × 0.3px` 的微抖动（模拟手绘"不完美"）

## 鼠标涟漪 (Ripple) · 多 ring 同心扩散

**触发**：鼠标移动 / 触摸（throttled 到 60Hz）。
- 每 130ms 鼠标移动时产生一个新 ring（最多同时 4 个活跃 ring）

**物理参数**：
- 扩散速度 `220 px/s`
- 最大半径 `130px`
- Ring 厚度 `20px`（仅这个带内的粒子受推力）
- 推力峰值 `4`，按距离 ring 中心衰减

**对粒子的作用**：
- 在 ring 当前半径 ±20px 带内，粒子受**径向外推**
- 离开扰动后粒子用**弹簧回归**（spring k=0.06, damping=0.85）
- 视觉效果：水波散开 → 粒子被"推开" → 慢慢复原

## 状态相关行为

| 状态 | 粒子行为 |
|---|---|
| **Idle** | 粒子在目标位置 ± 微抖；周期性"呼吸"（整体放大 1% 缩回） |
| **Hover（动物）** | 该动物粒子密度跳到 hover 档；外围粒子向其聚拢（耗时 200ms） |
| **Click（进入）** | 粒子先收紧（爆点）→ 重组为 hub 形态（800-1000ms 过渡） |
| **Scroll** | 粒子位置随 scroll 微移（视差感 ±5px） |
| **Ripple 经过角色** | § 4 末尾的彩蛋（猫震 / 狼逆向 / 鹿外散） |

---

# § 8 · 技术架构

## 栈

```
Next.js 14 (App Router) + React 18
  + React Three Fiber (R3F) + @react-three/drei (Three.js 包装)
  + Zustand (轻量状态管理)
  + Tailwind CSS (subpage 共享 layout 的样式)
  + MDX (essays 内容)
  + framer-motion (UI 转场，非粒子)

Backend:
  + Next.js API Routes (Edge runtime)
  + Vercel KV (留言存储)
  + Resend (邮件通知 — Day 10 配置)

Deploy:
  + Vercel (免费层) via GitHub 集成
  + Vercel Analytics (启用)

Monitoring:
  + Sentry (免费层) — 异常 + WebGL 上下文丢失捕获
```

## 单 Canvas 模式（核心）

整站只有**一个** R3F `<Canvas>`，挂在 `RootLayout`，永不卸载。Canvas 内容随 route 变化但 WebGL context 持续——这是 Next.js + R3F 路径的核心理由：**无白屏粒子转场**。

```
<RootLayout>
  <PersistentCanvas>          ← R3F Canvas，跨路由持续
    <SceneController>          ← 读 useRouter()，决定渲染什么
      <EntryScene />            ← 当 route = /
      <HubScene animal=cat />   ← 当 route = /cat 或 /cat/*
      <SubpageAmbient />        ← 当 route = /[animal]/{essays|toys}
    </SceneController>
  </PersistentCanvas>
  <main>{children}</main>      ← 路由对应的 React 内容（在 Canvas 之上）
  <UIOverlay />                ← 顶栏、留言抽屉、换动物按钮
</RootLayout>
```

## 状态（Zustand store）

```ts
{
  currentAnimal: 'cat' | 'wolf' | 'deer' | null,
  lastAnimal: ...,              // localStorage 同步
  viewportMode: 'desktop' | 'mobile',
  reduceMotion: boolean,         // prefers-reduced-motion
  particleConfig: {
    densities: { idle, hover, character, ... },
    ripple: { radiusMax, durationMs, ... },
  },
  ripples: Ripple[],            // 活跃涟漪（最多 4 个）
  leaveMessageOpen: boolean,
}
```

## 路由 → 场景映射

| Route | Canvas 状态 | UI 层 |
|---|---|---|
| `/` | EntryScene（三联场景） | 入口顶栏 + 引导文字 |
| `/[animal]` | HubScene（该动物的世界） | 顶栏（换动物 / 留言）+ Hub 内容 |
| `/[animal]/essays` | SubpageAmbient（背景画 30% 透明 + 小角色） | Subpage layout + essay 列表 |
| `/[animal]/essays/:slug` | 同上 | Subpage + MDX 内容 |
| `/[animal]/toys` | 同上 | Subpage + toy cards |

## 文件结构

```
app/
  layout.tsx                     RootLayout + Canvas 挂载
  page.tsx                       /                (EntryScene)
  [animal]/
    page.tsx                     /[animal]        (HubPage)
    essays/page.tsx              /[animal]/essays
    essays/[slug]/page.tsx
    toys/page.tsx
  api/leave-message/route.ts     POST 端点

components/
  canvas/
    PersistentCanvas.tsx
    SceneController.tsx
    scenes/{Entry,Hub,Subpage}Scene.tsx
    AnimalCharacter.tsx          粒子角色（采样素描图）
    ParticleField.tsx            粒子系统封装
    shaders/{vert,frag}.glsl     自定义 shader
    Ripple.ts                    涟漪物理
  ui/{TopBar,LeaveMessageDrawer,SwitchAnimal}.tsx

content/
  {cat,wolf,deer}/
    about.mdx                    hub 主体内容
    essays/*.mdx
    toys.json
    voice.json                   关键文案集中地

public/assets/{cat,wolf,deer}/
  bg-entry.webp                  入口屏面板背景
  bg-hub.webp                    hub 大背景
  char-sketch.png                角色形态（粒子采样源）
  decorations/{...}.webp         3 个装饰元素（每动物）

lib/
  store.ts                       zustand
  particles.ts                   粒子数学
  ripple.ts                      涟漪物理
  voice.ts                       从 voice.json 取字串
  device-tier.ts                 设备分级

.env.local                       Resend / Vercel KV / Sentry keys (NOT committed)
```

## 写作系统

**v1 仅路径 1 · 直接 Git push**：你在本地 / GitHub.dev / 手机 git 客户端 edit MDX 文件 → push → Vercel webhook 自动 redeploy（~30s）。

**路径 2 · 网页内编辑器**：进 v1.x（`/admin/write` + GitHub OAuth + GitHub API commit）。

## SEO（最低限度）

- 每个 route 设 `<title>` 和 `<meta description>`（按动物语气）
- og:image：每只动物一张静态图（hub 截屏 / 入口屏截屏）
- 不主动做 sitemap

## API 路由（留言）

```ts
// app/api/leave-message/route.ts
export async function POST(req) {
  const { content, signature, animal } = await req.json()
  // validate, rate-limit by IP hash, ...
  await kv.lpush('messages', { ts, content, signature, animal, ip_hash })
  if (process.env.RESEND_KEY) {
    await sendEmail({ to: OWNER_EMAIL, subject: '...', body: ... })
  }
  return Response.json({ ok: true })
}
```

---

# § 9 · 资源生产管线

## v1 资源清单（已全部产出）

```
public/assets/cat/
  bg-entry.webp          入口屏猫面板背景（1920×1080）
  bg-hub.webp            猫 hub 全背景（1672×941）
  char-sketch.png        猫角色，透明底（1254×1254）
  decorations/
    books.webp           书堆
    teacup.webp          茶杯 + 蒸汽
    yarn.webp            毛线球

public/assets/wolf/      同上 6 张
  decorations/
    mountains.webp       远山剪影（16:5 横版）
    needles.webp         飘落的松针
    paw-prints.webp      爪印（16:9 横版）

public/assets/deer/      同上 6 张
  decorations/
    ripples.webp         水面波纹
    leaves.webp          漂浮的叶子
    mist.webp            流动雾气（9:16 竖版）

public/icons/
  switch-animal.svg
  leave-message.svg
  back-arrow.svg
```

**总计 18 张主资源 + 几个 SVG icon**，已在 `~/claude_code_workspace/.brainstorm-assets/anchor/` 备份。

## 风格锚 + AI 生成工作流

**已确认风格基线**：v0 阶段已锁定 6 张主背景 + 3 个 char-sketch + 9 个装饰，整体风格统一。

工作流：
1. ChatGPT（GPT-4o / DALL-E）生成，上传风格 ref（# 8 cat hub）+ tonal ref（# 15/17）
2. macOS Preview 自动去背景（char-sketch + 装饰）
3. 转 webp（quality 85）+ 子集化
4. 命名规则放入 `public/assets/{animal}/`

实施期会写一个**资源管线脚本**：批量转 webp、提取 alpha mask、生成多分辨率响应式图。10 分钟搞定 18 张。

## 资源风险（已通过 v0 验证）

- ✅ 风格在三只动物之间统一（同一 ChatGPT 对话 + 同一 ref）
- ✅ char-sketch 形状识别度（猫已重做为侧睡，剪影清晰）
- ✅ 所有图都符合 spec § 3 / § 4 / § 6 描述

---

# § 10 · 性能与移动端策略

## 性能预算（v1 目标）

| 指标 | 桌面 | 移动端 |
|---|---|---|
| FCP（首屏内容）| < 1.5s | < 2.5s |
| LCP（最大内容绘制）| < 2.5s | < 3.5s |
| 入口路由 bundle | < 300KB JS（gzipped）+ < 200KB 图片 | 同 |
| Hub 路由增量 | < 100KB JS + < 200KB 图片 | 同 |
| FPS 目标 | 60 | 30 |
| FPS 红线 | 30 | 24 |
| 单帧 GPU 时间 | ≤ 8ms | ≤ 16ms |
| 内存 | < 300MB | < 200MB |

不达标这些线时**自动降级**（粒子密度 ÷ 2、禁用 ripple 等）。

## 设备分级（启动时探测一次）

```ts
type Tier = 'high' | 'mid' | 'low'

function detectTier(): Tier {
  if (!hasWebGL2) return 'low'
  if (deviceMemory >= 8 && hardwareConcurrency >= 8 && viewportWidth >= 1280) return 'high'
  if (deviceMemory >= 4 && viewportWidth >= 768) return 'mid'
  return 'low'
}
```

粒子密度映射详见 § 7 表格。

Low tier **额外禁用**：head-tracking、ripple 改单帧扩散、移除装饰元素 ambient 动画。

## 资源加载策略

- **入口路由**：3 张 entry panel 在入口就 preload；char-sketch 不在入口加载
- **进入 hub 时**：当前动物的 `bg-hub.webp` + `char-{animal}.png` 优先加载
- **空闲时**：邻近动物（用户可能想换）的 `bg-hub` 后台预加载
- **进入 subpage 时**：装饰元素按需加载
- **MDX 内容**：SSG 静态生成，零额外请求

## 图片格式

- 背景图：**WebP** (quality 85) + AVIF 高级浏览器降级 + JPG 兜底
- char-sketch：PNG with alpha
- 响应式：每张图 2 档（桌面 1920w + 1280w，移动 768w + 480w）

## 移动端专属处理

- 触摸事件：tap = hover + click 复合
- 禁用画布区域的 pinch-zoom
- **Battery API** 检测：电量 < 20% 自动降级 1 档
- **Save-Data / 2G** 检测：跳过非关键动画，仅静态背景 + 文本

## prefers-reduced-motion 处理

由 OS 全局设置控制（macOS / iOS / Windows / Android 系统设置里）。

| 默认 | 减少动效模式 |
|---|---|
| 5-10 万粒子动态聚拢/呼吸 | **静态 char-sketch 剪影**（无动效） |
| 鼠标 ripple 同心圈传播 | 关闭 |
| 入口 → hub 粒子重组转场 | 改用 **300ms cross-fade** |
| 滚动视差、动物头部追踪 | 关闭 |
| 装饰元素 ambient 动画（蒸汽/松针/雾）| 静态 |

视觉策略：减少动效模式不是"残缺版"，是**"沉静版"**。

## Loading 状态

- 入口屏：1 秒 fade in 三个面板 + 1 秒 fade in 标题
- 进 hub：当前动物的 char-sketch 先以剪影出现，bg 加载完成后 fade up，粒子再 hatch out 形成动物
- 全局 timeout：> 5 秒不能 interactive 时显示降级版静态页（保底体验）
- **Loading 视觉**：复用 hub 视觉风格——动物剪影 + 简短 loading 文案（动物语气）

## 404 页面

- 复用 hub 的视觉风格（背景画淡化 + 角色剪影）
- 文案按动物语气定制（§ 6 已锁）
- 无需独立设计

---

# § 11 · 可访问性

## prefers-reduced-motion

详见 § 10。OS 层全局开关，v1 不在站内重复提供。

## 键盘导航

- **Tab 顺序**：左→右、上→下，沿可视层级
- **入口屏**：左右方向键在 3 只动物间切换聚焦，Enter 进入
- **Hub 内**：Tab 经 nav links → 留言按钮 → 换动物
- **Subpage**：Tab 经"返回 hub"→ 内容链接
- **ESC**：关闭留言抽屉、换动物浮层
- **Focus 指示**：所有可交互元素 `:focus-visible` 时显示 **3px 描边 + 动物 accent 色**

## 屏幕阅读器 / ARIA

- `<html lang="zh-CN">`
- 入口屏三动物面板：每个 `aria-label` = `"[动物]的世界 — [一句性格]"`
- char-sketch 粒子角色：`alt` = 动物名 + 简短描述
- 背景画：纯装饰，`aria-hidden="true"` + `alt=""`
- 装饰元素（书堆、爪印、水波等）：`aria-hidden`
- 跳过到内容：每页顶部 `<a href="#main">跳过到主要内容</a>`，仅 keyboard focus 时可见
- subpage 用语义标题：`<h1>` 主标题，`<h2>` 段落

## 色彩对比度（路线 A · 阅读优先）

正文用 **AAA (≥7:1)** 保证舒适阅读，标题用 **AA (≥4.5:1)** 让它退一档显得克制。

| 动物 | bg 主调 | 正文色 | 标题色 |
|---|---|---|---|
| 猫 | sepia warm grey | `#f0e6d2` (~13:1) | `#a18871` (~5:1) |
| 狼 | cool slate | `#c5d3df` (~13:1) | `#5e6a83` (~5:1) |
| 鹿 | misty sage | `#ebe7d6` (~13:1) | `#677252` (~5:1) |

实施期 audit 时再核实。

## 触控目标

所有按钮、链接 ≥ **44×44px**（WCAG mobile）。

## 表单（留言）可访问性

- 每个 input/textarea 有显式 `<label>`
- 必填字段 `aria-required="true"`
- 错误信息用 `aria-live="polite"` 自动报给屏幕阅读器
- 提交成功后 focus 跳到 success message

## 动画自动暂停

- **Page Visibility API**：标签页失活时暂停 RAF 循环
- **Battery API** ≤ 20%：降级 Low tier
- **Save-Data / 2G**：禁用粒子动画

## 验收 checklist（实施期）

- [ ] 关闭鼠标全程键盘走完一次完整旅程
- [ ] VoiceOver / TalkBack 至少听一遍三只动物的 hub
- [ ] Chrome devtools `prefers-reduced-motion: reduce` 切换看降级版
- [ ] axe-core / Lighthouse a11y 扫描分数 ≥ 85（v1.1 polish 到 90）

## 隐私

- 留言抽屉底部一行："你的留言只有 [你的名字] 能看到，不会公开展示"
- 网站 footer 一行："本站使用 Vercel Analytics（隐私友好的第一方匿名统计）"

---

# § 12 · 开放问题 + v1 实施 Checklist

## 时间表 · 方案 Y · 2-3 周（Agent Teams 并行）

### Week 1 · Foundation + 三动物 hub 并行

**Day 1**
- 脚手架（Next.js 14 + R3F + Tailwind + Zustand）
- GitHub repo 建好（你提前选个名字，例如 `personal-website`）
- Vercel 通过 GitHub 集成，hello-world 部署到位
- 起新 session，第一句对我说"用 agent teams 跑这个项目"，我创建 team

**Day 2 · 关键 spike**
- 粒子技术验证：在 prototype 上跑 50K-80K 粒子 + ripple，确认 60fps（**整个项目的成败点**）
- lead（我）创建 agent team：
  - `infra-engineer`：共享基建（粒子系统 + ripple + zustand store + 路由 + subpage layout）
  - `cat-builder`：猫 hub D persona
  - `wolf-builder`：狼 hub D persona
  - `deer-builder`：鹿 hub D persona

**Day 3-4 · 共享基建**
- infra-engineer 完成 ~70% 基建
- 三个 hub builder 用 mock 基建启动并行
- teammate 之间互相讨论

**Day 5-7 · 三 hub D persona 并行**
- 每天 review 三个 worktree + 让 teammates 互相挑战
- Day 7 三个 hub 基本就绪，merge 到 main

### Week 2 · 系统 + 集成 + 上线

| Day | 重点 |
|---|---|
| 8 | subpage 框架（MDX + ambient 角色 + accent 色应用） |
| 9 | 装饰元素 ambient 动画（9 个）+ ripple-character 互动彩蛋 |
| 10 | 留言后端（Vercel KV + Resend）+ 抽屉 UI |
| 11 | 移动端降级 + 设备分级 |
| 12 | a11y polish（≥ 85）+ 性能优化 + 字体 subsetting |
| 13 | 集成测试 + 真机回归 + 自动化测试基线 |
| 14 | v1 上线 |

### Week 3 · Buffer

- 上线后 hot fixes
- 真实用户数据观察 + 调优
- 第 1 篇 essay 内容定稿
- 1-2 个 AI 小玩意展示

## 质量保证 + 自测 + Debug

### 自动化测试（CI 保护）

- **TypeScript strict mode** + ESLint + Prettier 预提交 hook
- **单元测试 (Vitest)**：核心数学（ripple 物理、粒子采样、设备分级算法），覆盖率 ≥ 80%
- **E2E 测试 (Playwright)**：关键路径
  - 入口三联屏 → 选动物 → 进 hub → 看 about-me
  - hub → essay 详情 → 读完 → 留言 → 提交 → 反馈
  - 三动物切换
  - 移动端简化版全流程
- **视觉回归（Playwright screenshot diff）**：每只动物 3 张关键截图，PR 对比，画面变化必须人眼审过
- **Lighthouse CI**：性能 + a11y 分数 enforced，跌破阈值阻塞 deploy

### 调试工具（dev 模式自带）

- 浮动 debug 面板（右上角）：FPS、粒子数、当前 tier、活跃 ripple 数、内存
- URL 参数：`?tier=low`、`?particles=10000`、`?reduced-motion=force`
- 控制台 `window.debug.*` 助手

### 错误追踪（生产）

- **Sentry**（免费层）捕获 JS 异常 + WebGL 上下文丢失
- 留言提交失败 fallback：UI 提示 + localStorage 暂存 + 下次自动重试

### CI/CD 流程（GitHub Actions）

- 每个 PR 自动跑：type check / lint / 单元 / E2E / Lighthouse → 红了不让 merge
- merge → main 自动部署 Vercel
- 部署后跑 smoke tests 验证生产正常

### README 自查指南

- "粒子卡了怎么排查" / "如何调粒子参数" / "换 char-sketch" / "常见错误 + 解决方案"

## 域名

- v1 用 **vercel.app 子域名**（例 `lingrui-personal.vercel.app`）
- v1.x 切自定义域名（你可以用 Namecheap / Cloudflare 注册一个 ~$10/年）

## 访问数据 / Analytics

- **Vercel Analytics** 启用（免费层 ~2500 events/月，第一方匿名统计）
- 不使用第三方追踪（Google Analytics 等）

## v1.x 候选（不在 v1 范围）

- 英文版（i18n）
- 网页内编辑器（路径 2）
- 剩下 7 只动物
- 站内 reduced-motion 开关
- 邮件回复链路
- 自动 og:image 生成
- 后台 admin（看留言 UI）
- gstack brain 同步
- **真字体本地装**：钢笔鹤体 / 一点明朝 / 源云明体 SC subset 替换狼字体 stand-in
- 自定义域名

## 实施期需要拍板的决策

| 项 | 选项 | 默认 |
|---|---|---|
| 留言后端 | Vercel KV / Supabase / Notion | Vercel KV |
| 鉴权（v1.x 编辑器）| GitHub OAuth / PAT | 实施期定 |
| PWA / Service Worker | 启用 / 不启用 | 看 LCP 实测 |
| 音效 | 启用 / 不启用 | v1 不做 |

## 已知风险

| 风险 | 等级 | 应对 |
|---|---|---|
| 粒子在某些浏览器/GPU 不稳 | 🔴 高 | Day 2 spike 多设备验证 |
| Agent Teams 实验性 known bugs（resumption 不完美、shutdown 慢、in-process /resume 后 teammate 丢失）| 🟡 中 | 每天结束清理 team；新 session 重 spawn；避免 /resume |
| Token 消耗 ~5x（4 teammate + 1 lead 同时跑）| 🟡 中 | 监控 token 用量；必要时降到 2-3 teammate 串行 |
| Agent Teams 协调成本 | 🟡 中 | lead 持续 steer，每天 review，不挂机 |
| AI 资源风格漂移 | 🟢 低 | v0 已验证 18 张 |
| Vercel KV 免费额度 | 🟢 低 | 监控告警 |
| 字体 SC 字符不全 | 🟡 中 | fallback Noto Serif SC 900 |
| 移动端低端机 | 🟢 低 | 已 non-goal |
| 字体加载阻塞首屏 | 🟡 中 | font-display: swap + critical preload |

## v1 Definition of Done（硬指标）

- [ ] 入口屏中端笔记本 ≥ **60 fps**
- [ ] iPhone 12 ≥ **30 fps**
- [ ] FCP < 2.5s（移动 4G）
- [ ] 三动物 hub 完整 + 文字对比度 ≥ 4.5:1
- [ ] 留言提交工作（POST /api/leave-message + 数据落 Vercel KV）
- [ ] 键盘走完全流程
- [ ] axe-core / Lighthouse a11y **≥ 85**（v1.1 polish 到 90）
- [ ] 邮件通知配置妥（Resend）
- [ ] 单元测试覆盖 ripple + 粒子核心数学（≥ 80% 覆盖率）
- [ ] E2E 关键路径（5 条）全过
- [ ] 视觉回归基线建立（每动物 3 张关键截图）
- [ ] Lighthouse CI 在 main 分支跑通
- [ ] Sentry 集成完成 + 至少捕获 1 类 WebGL 异常验证
- [ ] README 写完："如何更新内容 / 调粒子 / 换字体 / 部署"

## 提醒事项（实施期我会主动 ping 你）

1. ⏰ **Day 1**：建 GitHub repo（你提前选个名字）
2. ⏰ **Day 1-2**：起新 session 创建 agent team
3. ⏰ **Day 10**：留言邮件需要 **Resend API key**（注册 resend.com 拿 key 写到 .env.local）
4. ⏰ **Day 13-14**：要不要执行 gstack team mode 把项目 bootstrap？（个人 repo 可以跳过）
5. ⏰ **v1 上线后**：考虑装真字体（钢笔鹤体 / 一点明朝 / 源云明体 SC subset）
6. ⏰ **v1 上线后**：考虑切自定义域名

---

# 附录 A · 资源清单（已完成 v0 验证）

```
~/claude_code_workspace/.brainstorm-assets/anchor/
  style-anchor-cat-hub.png       (1672×941)  ⭐ 风格基线
  style-anchor-cat-entry.png     (529×941)
  style-anchor-wolf-hub.png      (1672×941)
  style-anchor-wolf-entry.png    (1672×941)
  style-anchor-deer-hub.png      (1672×941)
  style-anchor-deer-entry.png    (1672×941)
  char-cat.png                   (1254×1254, alpha)
  char-wolf.png                  (1254×1254, alpha)
  char-deer.png                  (1254×1254, alpha)
  deco-cat-books-raw.png
  deco-cat-teacup-raw.png
  deco-cat-yarn-raw.png
  deco-wolf-mountains-raw.png
  deco-wolf-needles-raw.png
  deco-wolf-prints-raw.png
  deco-deer-ripples-raw.png
  deco-deer-leaves-raw.png
  deco-deer-mist-raw.png
```

实施期：装饰元素需要去背景（macOS Preview 一键），然后批量转 webp + 多分辨率。

---

# 附录 B · 关键决策时间线

- **Day 0 (2026-05-09 - 2026-05-10 brainstorm)**: 全部设计决策做完，资源全部产出
- **Day 1**: 实施开始
- **Day 14**: v1 上线
- **Week 3 (Buffer)**: hot fixes、调优、内容定稿
