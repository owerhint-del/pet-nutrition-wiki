import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = docs[0]
  if (!category) return { title: 'Категория не найдена' }

  return {
    title: category.title,
    description: category.description || `Статьи в категории "${category.title}"`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const category = categories[0]
  if (!category) notFound()

  const { docs: articles } = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { category: { equals: category.id } },
        { status: { equals: 'published' } },
      ],
    },
    sort: 'title',
    depth: 1,
    limit: 100,
  })

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/" className="hover:text-sage-600">Главная</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-700">{category.title}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {category.icon && <span className="text-4xl">{category.icon}</span>}
          <h1 className="text-3xl font-bold text-sage-800">{category.title}</h1>
        </div>
        {category.description && (
          <p className="text-stone-600 max-w-2xl">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-stone-400">{articles.length} статей</p>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-sage-200 bg-white p-5 hover:border-sage-400 hover:shadow-md transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {article.contentType === 'transcript' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Видео
                  </span>
                )}
                {article.species?.map((s) => (
                  <span key={s} className="text-xs text-stone-400">
                    {s === 'dogs' ? '🐕' : '🐈'}
                  </span>
                ))}
              </div>
              <h2 className="font-semibold text-sage-700 group-hover:text-sage-600">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="mt-1 text-sm text-stone-500 line-clamp-2">{article.excerpt}</p>
              )}
            </div>
            {article.transcriptWordCount && article.transcriptWordCount > 3000 && (
              <span className="shrink-0 text-xs text-stone-400">
                ~{Math.round(article.transcriptWordCount / 200)} мин.
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
