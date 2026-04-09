'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'

type PlanningView = 'jour' | 'semaine' | 'mois'

// Service letter + color matching crm.html
function getServiceCell(service: string): { letter: string; bg: string } {
  const s = (service ?? '').toLowerCase()
  if (s.includes('helicop') || s.includes('heli')) return { letter: 'H', bg: '#2563eb' }
  if (s.includes('jet'))                             return { letter: 'J', bg: '#1e40af' }
  if (s.includes('aeroport') || s.includes('aéroport')) return { letter: 'A', bg: '#b45309' }
  if (s.includes('disposition') || s.includes('mad')) return { letter: 'M', bg: '#15803d' }
  if (s.includes('restaurant') || s.includes('resto')) return { letter: 'R', bg: '#7c3aed' }
  if (s.includes('location'))                         return { letter: 'L', bg: '#0f766e' }
  return { letter: 'T', bg: '#475569' }
}

function getStatutColor(statut: string): string {
  const map: Record<string, string> = {
    confirmed: '#fbbf24',
    paid:      '#48c78e',
    devis:     '#9ca3af',
    pending:   '#fbbf24',
    part_paid: '#60a5fa',
    completed: '#48c78e',
    cancelled: '#ef4444',
  }
  return map[statut] ?? '#9ca3af'
}

function getMondayOf(d: Date): Date {
  const day = d.getDay() || 7
  const m = new Date(d)
  m.setDate(m.getDate() - (day - 1))
  m.setHours(0, 0, 0, 0)
  return m
}

const STATUT_LABELS: Record<string, string> = {
  confirmed: 'Att. paiement',
  paid: 'Payé',
  devis: 'Devis',
  pending: 'En attente',
  part_paid: 'Acompte',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

interface PlanningClientProps {
  reservations: Record<string, unknown>[]
}

export default function PlanningClient({ reservations }: PlanningClientProps) {
  const [view, setView] = useState<PlanningView>('semaine')
  const [anchor, setAnchor] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const active = reservations.filter((r) => r.statut !== 'cancelled')

  function navPrev() {
    if (view === 'jour') setAnchor((d) => addDays(d, -1))
    else if (view === 'semaine') setAnchor((d) => addDays(d, -7))
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function navNext() {
    if (view === 'jour') setAnchor((d) => addDays(d, 1))
    else if (view === 'semaine') setAnchor((d) => addDays(d, 7))
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function navToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setAnchor(d)
  }

  function getTitle() {
    if (view === 'jour') {
      const isToday = isSameDay(anchor, today)
      const str = format(anchor, 'EEEE d MMMM yyyy', { locale: fr })
      return isToday ? `Aujourd'hui — ${str}` : str
    }
    if (view === 'semaine') {
      const monday = getMondayOf(anchor)
      const sunday = addDays(monday, 6)
      return `Semaine du ${format(monday, 'd MMM', { locale: fr })} au ${format(sunday, 'd MMM yyyy', { locale: fr })}`
    }
    return format(anchor, 'MMMM yyyy', { locale: fr })
  }

  function getMissionsForDay(d: Date) {
    return active
      .filter((r) => {
        try { return isSameDay(new Date(r.date as string), d) } catch { return false }
      })
      .sort((a, b) => ((a.heure as string) ?? '').localeCompare((b.heure as string) ?? ''))
  }

  // ── JOUR VIEW ───────────────────────────────────────────────
  function renderJour() {
    const ms = getMissionsForDay(anchor)
    if (ms.length === 0) {
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-16 text-center text-sm text-neutral-500">
          Aucune mission ce jour
        </div>
      )
    }
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                {['#', 'Heure', 'Service', 'Client', 'Prestation', 'Véhicule', 'Intervenant'].map((h, i) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500 whitespace-nowrap"
                    style={{ width: i === 0 ? 70 : i === 1 ? 72 : i === 2 ? 52 : i === 3 ? 130 : i === 4 ? undefined : i === 5 ? 120 : 115 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ms.map((r) => {
                const client = r.client as Record<string, string> | null
                const chauffeur = r.chauffeur as Record<string, string> | null
                const svc = getServiceCell(r.service as string)
                const statutColor = getStatutColor(r.statut as string)
                const depart = r.depart as string | null
                const dest = r.destination as string | null
                const prestation = depart && dest
                  ? `${depart.split(',')[0]} → ${dest.split(',')[0]}`
                  : !!r.resto ? (r.resto as string)
                  : (r.service as string ?? '—')
                return (
                  <tr key={r.id as string} className="border-b border-neutral-800/60 transition hover:bg-neutral-900/40">
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-mono text-xs font-semibold text-[#C9A060]">
                        {(r.id as string)?.slice(0, 6).toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-sm font-semibold text-[#C9A060]">{r.heure as string ?? '—'}</span>
                    </td>
                    <td className="py-0 px-0" style={{ height: 1 }}>
                      <div className="flex h-full min-h-[48px] items-center justify-center"
                        style={{ background: svc.bg }}>
                        <span className="text-sm font-bold text-white">{svc.letter}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-white">
                        {client ? `${client.prenom} ${client.nom}` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-neutral-300">{prestation}</div>
                      {!!(r.pax) && (
                        <div className="mt-0.5 text-xs text-neutral-500">{r.pax as string} pax</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs text-neutral-400">{r.vehicule as string ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-neutral-300">
                        {chauffeur?.nom ?? (r.chauffeur_nom as string) ?? '—'}
                      </div>
                      <div className="mt-0.5">
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                          style={{ color: statutColor, background: `${statutColor}20`, border: `1px solid ${statutColor}40` }}>
                          {STATUT_LABELS[r.statut as string] ?? r.statut as string}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── SEMAINE VIEW ────────────────────────────────────────────
  function renderSemaine() {
    const monday = getMondayOf(anchor)
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                {days.map((d) => {
                  const isToday = isSameDay(d, today)
                  return (
                    <th key={d.toISOString()} className="px-3 py-2.5 text-center" style={{ width: '14.28%' }}>
                      <div className="text-xs text-neutral-500 capitalize">
                        {format(d, 'EEE', { locale: fr })}
                      </div>
                      <div className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? 'bg-[#C9A060]/15 text-[#C9A060]' : 'text-white'
                      }`} style={isToday ? { border: '1px solid rgba(201,160,96,0.4)' } : {}}>
                        {format(d, 'd')}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                {days.map((d) => {
                  const ms = getMissionsForDay(d)
                  return (
                    <td key={d.toISOString()} className="border-r border-neutral-800/60 px-1.5 py-2 last:border-r-0" style={{ minHeight: 100 }}>
                      {ms.map((r, idx) => {
                        const client = r.client as Record<string, string> | null
                        const statutColor = getStatutColor(r.statut as string)
                        const svc = getServiceCell(r.service as string)
                        const depart = r.depart as string | null
                        const dest = r.destination as string | null
                        const prestation = depart && dest
                          ? `${depart.split(',')[0]} → ${dest.split(',')[0]}`
                          : !!r.resto ? (r.resto as string)
                          : ''
                        return (
                          <div key={r.id as string}
                            className="mb-1.5 cursor-pointer rounded px-2 py-1.5 transition hover:bg-neutral-800/60"
                            style={{ borderLeft: `3px solid ${svc.bg}`, background: idx % 2 === 1 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)' }}>
                            <div className="truncate text-[11px] font-medium text-white">
                              {client ? `${client.prenom} ${client.nom}` : '—'}
                            </div>
                            <div className="truncate text-[10px] text-neutral-400">
                              {r.heure as string ?? ''}{prestation ? ` · ${prestation}` : ''}
                            </div>
                            <span className="mt-0.5 inline-block rounded px-1 py-px text-[9px] font-semibold"
                              style={{ color: statutColor, background: `${statutColor}20` }}>
                              {STATUT_LABELS[r.statut as string] ?? r.statut as string}
                            </span>
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── MOIS VIEW ───────────────────────────────────────────────
  function renderMois() {
    const year = anchor.getFullYear()
    const month = anchor.getMonth()
    const firstDay = startOfMonth(anchor)
    const lastDay = endOfMonth(anchor)
    const gridStart = getMondayOf(firstDay)
    // How many days from gridStart to end
    const totalDays = Math.ceil((lastDay.getTime() - gridStart.getTime()) / 86400000) + 1 + (6 - getDay(lastDay) || 7)
    const totalWeeks = Math.ceil((getMondayOf(firstDay).getTime() === gridStart.getTime() ? totalDays : totalDays) / 7)
    const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, wi) =>
      Array.from({ length: 7 }, (__, di) => addDays(gridStart, wi * 7 + di))
    )
    const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              {DAY_NAMES.map((d) => (
                <th key={d} className="px-2 py-2.5 text-center text-[11px] font-medium text-neutral-500" style={{ width: '14.28%' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi} className="align-top">
                {week.map((d) => {
                  const isCurrentMonth = d.getMonth() === month
                  const isToday = isSameDay(d, today)
                  const ms = getMissionsForDay(d)
                  return (
                    <td key={d.toISOString()}
                      className="border border-neutral-800/60 p-1.5"
                      style={{ minHeight: 80, background: isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.18)' }}>
                      <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? 'bg-[#C9A060]/15 text-[#C9A060]' : isCurrentMonth ? 'text-white' : 'text-neutral-600'
                      }`} style={isToday ? { border: '1px solid rgba(201,160,96,0.4)' } : {}}>
                        {format(d, 'd')}
                      </div>
                      {ms.map((r) => {
                        const client = r.client as Record<string, string> | null
                        const svc = getServiceCell(r.service as string)
                        return (
                          <div key={r.id as string}
                            className="mb-0.5 truncate rounded px-1 py-px text-[10px] text-neutral-300 cursor-pointer hover:bg-neutral-800/50"
                            style={{ borderLeft: `2px solid ${svc.bg}`, background: 'rgba(255,255,255,0.04)' }}>
                            {client ? `${client.prenom} ${client.nom}` : '—'}
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white capitalize">{getTitle()}</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {active.length} mission{active.length !== 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex overflow-hidden rounded-lg border border-neutral-800">
            {(['jour', 'semaine', 'mois'] as PlanningView[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  view === v
                    ? 'bg-[#C9A060] text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Nav */}
          <button onClick={navPrev}
            className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 transition hover:border-neutral-700 hover:text-white">
            <ChevronLeft size={15} />
          </button>
          <button onClick={navToday}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white">
            Aujourd&apos;hui
          </button>
          <button onClick={navNext}
            className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 transition hover:border-neutral-700 hover:text-white">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {view === 'jour' && renderJour()}
      {view === 'semaine' && renderSemaine()}
      {view === 'mois' && renderMois()}
    </div>
  )
}
