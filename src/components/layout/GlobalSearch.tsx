'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, CalendarDays, Car, Handshake, Receipt, X } from 'lucide-react'
import { globalSearchAction } from '@/app/actions/search'
import type { SearchResult } from '@/app/actions/search'

const TYPE_CONFIG = {
  client:      { icon: Users,        label: 'Client',      color: '#C9A060' },
  reservation: { icon: CalendarDays, label: 'Réservation', color: '#60a5fa' },
  chauffeur:   { icon: Car,          label: 'Chauffeur',   color: '#4ade80' },
  partenaire:  { icon: Handshake,    label: 'Partenaire',  color: '#c084fc' },
  facture:     { icon: Receipt,      label: 'Facture',     color: '#fb923c' },
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Raccourci Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  // Debounce recherche
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearchAction(query)
        setResults(res)
        setSelected(0)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected])
  }

  // Grouper par type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={16} className="text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher clients, réservations, chauffeurs..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} className="text-neutral-500 hover:text-neutral-300 transition">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">Recherche...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">Aucun résultat pour &quot;{query}&quot;</div>
          )}
          {!loading && !query && (
            <div className="px-4 py-6 text-center text-sm text-neutral-500">
              Tapez pour rechercher dans tous les modules
              <div className="mt-2 flex items-center justify-center gap-1">
                <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">⌘</kbd>
                <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">K</kbd>
                <span className="text-xs text-neutral-500 ml-1">pour ouvrir</span>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {(Object.entries(grouped) as [keyof typeof TYPE_CONFIG, SearchResult[]][]).map(([type, items]) => {
                const { icon: Icon, label, color } = TYPE_CONFIG[type] ?? TYPE_CONFIG.client
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <Icon size={11} style={{ color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}s</span>
                    </div>
                    {items.map((r) => {
                      const idx = results.indexOf(r)
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r)}
                          onMouseEnter={() => setSelected(idx)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition"
                          style={idx === selected ? { background: 'var(--bg-3)' } : {}}
                        >
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                          >
                            <Icon size={12} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{r.label}</p>
                            {r.sublabel && <p className="text-[11px] text-neutral-500 truncate">{r.sublabel}</p>}
                          </div>
                          {idx === selected && (
                            <kbd className="flex-shrink-0 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">↵</kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
