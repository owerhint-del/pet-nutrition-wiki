import Link from 'next/link'
import { SearchInput } from './SearchInput'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-sage-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sage-700 hover:text-sage-600">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold hidden sm:inline">Натуральное питание</span>
          <span className="text-lg font-bold sm:hidden">НатПит</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/categories/perevod" className="text-stone-600 hover:text-sage-600">
            Перевод
          </Link>
          <Link href="/categories/produkty" className="text-stone-600 hover:text-sage-600">
            Продукты
          </Link>
          <Link href="/guide" className="text-stone-600 hover:text-sage-600">
            Полный гайд
          </Link>
        </nav>

        <div className="w-48 md:w-64">
          <SearchInput />
        </div>
      </div>
    </header>
  )
}
