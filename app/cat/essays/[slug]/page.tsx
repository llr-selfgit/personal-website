import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { SubPageLayout } from '@/components/ui/SubPageLayout'
import { getEssay, getEssays } from '@/lib/content'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getEssays('cat').map((e) => ({ slug: e.slug }))
}

export function generateMetadata({ params }: Props) {
  const essay = getEssay('cat', params.slug)
  if (!essay) return { title: '随笔 · cat' }
  return { title: `${essay.title} · 随笔` }
}

function formatDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-cat-zh text-2xl text-cat-highlight mt-10 mb-4" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-cat-zh text-xl text-cat-highlight mt-8 mb-3" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-cat-body/85 leading-loose mb-5" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-cat-accent underline underline-offset-4 decoration-cat-accent/40 hover:decoration-cat-accent"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-cat-accent/60 pl-4 my-6 text-cat-body/75 italic"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside pl-6 my-5 space-y-2 text-cat-body/85" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside pl-6 my-5 space-y-2 text-cat-body/85" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="font-mono text-sm bg-cat-mid/60 text-cat-highlight px-1.5 py-0.5 rounded"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-cat-heading/30" />,
}

export default function CatEssayPage({ params }: Props) {
  const essay = getEssay('cat', params.slug)
  if (!essay) notFound()

  return (
    <SubPageLayout animal="cat" title={essay.title} subtitle={formatDate(essay.date)}>
      <article className="mt-8 font-cat-zh text-base md:text-[17px]">
        <MDXRemote source={essay.body} components={mdxComponents} />
      </article>
    </SubPageLayout>
  )
}
