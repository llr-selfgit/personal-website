import Link from 'next/link'
import { SubPageLayout } from '@/components/ui/SubPageLayout'
import { getEssays } from '@/lib/content'

export const metadata = {
  title: '随笔 · cat',
}

function formatDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function CatEssaysIndex() {
  const essays = getEssays('cat')

  return (
    <SubPageLayout
      animal="cat"
      title="essays"
      subtitle="把没想清楚的东西先写下来，等它自己长出来。"
    >
      {essays.length === 0 ? (
        <p className="text-cat-heading/70 italic mt-12">还没写下什么，先空着。</p>
      ) : (
        <ul className="space-y-10 mt-6">
          {essays.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/cat/essays/${e.slug}`}
                className="group block transition-colors"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-cat-en text-cat-heading/60 text-sm tabular-nums whitespace-nowrap">
                    {formatDate(e.date)}
                  </span>
                  <h2 className="font-cat-zh text-2xl text-cat-body group-hover:text-cat-accent transition-colors">
                    {e.title}
                  </h2>
                </div>
                {e.summary && (
                  <p className="mt-2 ml-0 text-cat-body/70 text-sm leading-relaxed">
                    {e.summary}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SubPageLayout>
  )
}
