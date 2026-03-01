import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Поиск: ${q}` : 'Поиск',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  let results: Array<{
    id: number
    title: string
    slug: string
    excerpt?: string | null
    contentType: string
  }> = []

  if (query) {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            or: [
              { title: { contains: query } },
              { excerpt: { contains: query } },
            ],
          },
        ],
      },
      limit: 50,
      depth: 0,
    })
    results = docs as typeof results
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-sage-800 mb-6">Поиск</h1>

      <form action="/search" className="mb-8">
        <div className="relative max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Введите запрос..."
            className="w-full rounded-xl border border-sage-300 bg-white px-5 py-3 text-base placeholder:text-stone-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-300"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-sage-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sage-500"
          >
            Найти
          </button>
        </div>
      </form>

      {query && (
        <div>
          <p className="text-sm text-stone-500 mb-4">
            {results.length > 0
              ? `Найдено: ${results.length}`
              : 'Ничего не найдено. Попробуйте другой запрос.'}
          </p>

          <div className="space-y-4">
            {results.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group block rounded-xl border border-sage-200 bg-white p-5 hover:border-sage-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  {article.contentType === 'transcript' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Видео
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-sage-700 group-hover:text-sage-600">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-1 text-sm text-stone-500 line-clamp-2">{article.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
