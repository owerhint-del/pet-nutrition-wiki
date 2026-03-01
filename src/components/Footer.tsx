import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-sage-200 bg-sage-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-lg font-bold text-sage-700">🐾 Натуральное питание питомцев</p>
            <p className="mt-2 text-sm text-stone-500 max-w-md">
              Открытая база знаний о переводе собак и кошек на натуральное питание.
              Материалы собраны из ветеринарных Telegram-каналов.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <h3 className="font-semibold text-sage-700 mb-2">Разделы</h3>
              <ul className="space-y-1">
                <li><Link href="/guide" className="text-stone-500 hover:text-sage-600">Полный гайд</Link></li>
                <li><Link href="/search" className="text-stone-500 hover:text-sage-600">Поиск</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sage-700 mb-2">Проект</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://github.com/nmaximov/pet-nutrition-wiki" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-sage-600">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-sage-200 pt-4 text-center text-xs text-stone-400">
          Открытый проект — MIT License
        </div>
      </div>
    </footer>
  )
}
