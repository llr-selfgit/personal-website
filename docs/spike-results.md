# Particle Spike Results · 2026-05-10

## 测试环境

- 桌面: [user 的机器]（推断 Mid-High tier，basis 50K @ 56fps）
- iPhone: [iPhone 12+ 推断]（明显 High tier 性能水平）
- 浏览器: Vercel deployed `/spike` page over LAN

## 数据

### 桌面

| 动物 | 8K | 40K | 50K (Mid) | 70K | 80K (High) | 100K |
|---|---|---|---|---|---|---|
| 🐱 猫 | 60 | 58 | 56 | 54 | **54** | 54 |
| 🐺 狼 | 58 | 58 | 54 | 56 | **52** | 52 |
| 🦌 鹿 | 60 | 54 | 56 | 52 | **50** | 52 |

### iPhone

| 动物 | 8K | 40K | 50K (Mid) | 70K | 80K | 100K |
|---|---|---|---|---|---|---|
| 🐱 猫 | 60 | 57 | 56 | 58 | 56 | 58 |
| 🐺 狼 | 60 | 60 | 60 | 58 | 60 | 60 |
| 🦌 鹿 | 60 | 58 | 60 | 58 | 59 | 58 |

## 验收

- ✅ **桌面 80K = 50-54fps** —— 微低于 60 目标但远超 24 红线，可接受
- ✅ **iPhone 50K = 56-60fps** —— 远超 30 移动端目标
- ✅ **iPhone 100K = 58fps** —— 出乎意料的强

## 调整决定

**保留当前 PARTICLE_COUNTS（80K/50K/15K）不变**。理由：
- 数据全部过红线
- 桌面 80K 50fps 主观感受流畅
- iPhone GPU 比预期强，有 headroom（v1.x 可考虑给现代 iPhone 升 High tier）

## v1.x 候选

- 调整 `detectTier` 算法，让现代 iPhone（A14+）走 High tier 而非 Mid，充分利用其 GPU
- 真实用户数据观察 1 周后，根据 Sentry / Vercel Analytics 中的设备分布 + perf 数据再决定

## Verdict

🟢 **SPIKE PASS** —— particle system perf 满足 spec § 7 / § 10 要求，可以进 Day 3+ Hub 实施。
