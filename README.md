# 个人网站 · 三动物粒子美学

A personal website with a unique three-animal selection experience and high-density particle aesthetic. Visitors land on a triptych scene of three worlds (cat / wolf / deer), pick one, and enter that animal's fully-themed hub.

**Status:** v1 implementation in progress.

## 三只动物

- 🐱 **猫** — 慵懒思考者 (lazy intellectual)
- 🐺 **狼** — 机敏战略家 (sharp strategist)
- 🦌 **鹿** — 灵性见证者 (ethereal witness)

## 文档

- **Design Spec:** [docs/superpowers/specs/2026-05-10-personal-website-design.md](docs/superpowers/specs/2026-05-10-personal-website-design.md) · 1007 行设计文档
- **Implementation Plan:** [docs/superpowers/plans/2026-05-10-personal-website-implementation.md](docs/superpowers/plans/2026-05-10-personal-website-implementation.md) · 14 天实施计划

## 技术栈（规划中）

- Next.js 14 (App Router)
- React Three Fiber + 自定义 GLSL shader（粒子系统）
- TypeScript / Tailwind CSS / Zustand / MDX
- Vercel KV（留言后端）+ Resend（邮件通知）
- Playwright + Vitest（测试）

## 视觉资源

`public/assets/{cat,wolf,deer}/` 包含每只动物的 6 张主图 + 3 张装饰素材（待 v1 实施期批量去背景 + 转 webp）。
