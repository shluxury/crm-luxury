import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CRM Luxury',
  description: 'Gestion des réservations chauffeur et conciergerie',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="h-full bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  )
}
