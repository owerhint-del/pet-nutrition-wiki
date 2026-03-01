'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchInput() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по статьям..."
        className="w-full rounded-lg border border-sage-200 bg-white px-3 py-1.5 text-sm placeholder:text-stone-400 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-sage-600"
        aria-label="Искать"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
      </button>
    </form>
  )
}
