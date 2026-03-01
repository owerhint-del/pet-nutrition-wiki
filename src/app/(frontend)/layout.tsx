import React from 'react'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Натуральное питание питомцев',
    template: '%s — Натуральное питание питомцев',
  },
  description: 'Wiki-база знаний о натуральном питании собак и кошек. Гайды по переводу, рационы, продукты, советы ветеринаров.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-cream text-stone-800 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
