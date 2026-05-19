import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Animal } from './types'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

export interface EssayMeta {
  slug: string
  title: string
  date: string
  summary?: string
  tags?: string[]
}

export interface Essay extends EssayMeta {
  body: string
}

export interface Toy {
  slug: string
  title: string
  summary: string
  href?: string
  cover?: string
  status?: 'wip' | 'live'
}

export interface Photo {
  src: string
  caption?: string
  date?: string
  alt?: string
}

function essaysDir(animal: Animal) {
  return path.join(CONTENT_ROOT, animal, 'essays')
}

export function getEssays(animal: Animal): EssayMeta[] {
  const dir = essaysDir(animal)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const { data } = matter(raw)
      const slug = file.replace(/\.mdx?$/, '')
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? '',
        summary: data.summary,
        tags: data.tags,
      } satisfies EssayMeta
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getEssay(animal: Animal, slug: string): Essay | null {
  const dir = essaysDir(animal)
  const candidates = [`${slug}.mdx`, `${slug}.md`].map((f) => path.join(dir, f))
  const file = candidates.find((p) => fs.existsSync(p))
  if (!file) return null
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '',
    summary: data.summary,
    tags: data.tags,
    body: content,
  }
}

export function getToys(animal: Animal): Toy[] {
  const file = path.join(CONTENT_ROOT, animal, 'toys.json')
  if (!fs.existsSync(file)) return []
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  return Array.isArray(json.items) ? json.items : []
}

export function getPhotos(animal: Animal): Photo[] {
  const file = path.join(CONTENT_ROOT, animal, 'photos', 'index.json')
  if (!fs.existsSync(file)) return []
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  return Array.isArray(json.items) ? json.items : []
}
