'use client'

import { useEffect, useState } from 'react'

type Heading = {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const article = document.querySelector('.prose')
    if (!article) return

    const elements = article.querySelectorAll('h2, h3')
    const items: Heading[] = Array.from(elements).map((el) => {
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || ''
      }
      return {
        id: el.id,
        text: el.textContent || '',
        level: parseInt(el.tagName.charAt(1)),
      }
    })
    setHeadings(items)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (headings.length < 3) return null

  return (
    <nav className="hidden lg:block sticky top-24">
      <h4 className="text-sm font-semibold text-sage-700 mb-3">Содержание</h4>
      <ul className="space-y-1 text-sm border-l-2 border-sage-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block border-l-2 -ml-[2px] py-1 transition-colors ${
                h.level === 3 ? 'pl-6' : 'pl-3'
              } ${
                activeId === h.id
                  ? 'border-sage-500 text-sage-700 font-medium'
                  : 'border-transparent text-stone-500 hover:text-sage-600 hover:border-sage-300'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
