'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import Badge, { statutReservationBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useSettings } from '@/components/providers/SettingsProvider'

const SERVICE_SHORT: Record<string, string> = {
  transfert_aeroport: 'Aéroport',
  transfert_simple: 'Transfert',
  mise_a_disposition: 'MAD',
  helicoptere: 'Héli.',
  jet_prive: 'Jet',
  restaurant: 'Restaurant',
  location_voiture: 'Location',
}

const SERVICE_COLORS: Record<string, string> = {
  transfert_aeroport: 'border-l-blue-500',
  transfert_simple: 'border-l-sky-400',
  mise_a_disposition: 'border-l-violet-500',
  helicoptere: 'border-l-amber-500',
  jet_prive: 'border-l-[#C9A060]',
  restaurant: 'border-l-rose-500',
  location_voiture: 'border-l-emerald-500',
}

interface PlanningClientProps {
  reservations: Record<string, unknown>[]
}

export default function PlanningClient({ reservations }: PlanningClientProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [filterEntite, setFilterEntite] = useState('')
  const { entites } = useSettings()
  const entitesActives = entites.filter((e) => e.actif)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const filtered = filterEntite
    ? reservations.filter((r) => r.entite === filterEntite)
    : reservations

  function getReservationsForDay(day: Date) {
    return filtered
      .filter((r) => {
        try {
          return isSameDay(new Date(r.date as string), day)
        } catch {
          return false
        }
      })
      .sort((a, b) => ((a.heure as string) ?? '').localeCompare((b.heure as string) ?? ''))
  }

  const hasAnyReservation = weekDays.some((d) => getReservationsForDay(d).length > 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Planning</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            Semaine du {format(currentWeekStart, 'd MMM', { locale: fr })} au{' '}
            {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterEntite} onChange={(e) => setFilterEntite(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none">
            <option value="">Toutes les entités</option>
            {entitesActives.map((e) => (
              <option key={e.id} value={e.id}>{e.nom || e.id}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
              className="rounded-lg border border-neutral-800 p-2 text-neutral-400 transition hover:border-neutral-700 hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="rounded-lg border border-neutral-800 px-3 py-2 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white">
              Aujourd'hui
            </button>
            <button onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
              className="rounded-lg border border-neutral-800 p-2 text-neutral-400 transition hover:border-neutral-700 hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {!hasAnyReservation ? (
        <EmptyState icon={CalendarDays}
          title="Aucune mission cette semaine"
          description="Les réservations confirmées apparaissent ici" />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayResas = getReservationsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className="min-h-[120px]">
                <div className={`mb-2 rounded-lg px-2 py-1.5 text-center ${
                  isToday ? 'bg-[#C9A060]/10 border border-[#C9A060]/30' : ''
                }`}>
                  <p className="text-xs font-medium text-neutral-400 capitalize">
                    {format(day, 'EEE', { locale: fr })}
                  </p>
                  <p className={`text-lg font-semibold ${isToday ? 'text-[#C9A060]' : 'text-white'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {dayResas.map((r) => {
                    const client = r.client as Record<string, string> | null
                    const chauffeur = r.chauffeur as Record<string, string> | null
                    const { variant } = statutReservationBadge(r.statut as string)
                    return (
                      <div key={r.id as string}
                        className={`rounded-lg border border-neutral-800 border-l-2 bg-neutral-900 p-2 ${
                          SERVICE_COLORS[r.service as string] ?? 'border-l-neutral-600'
                        }`}>
                        <p className="text-xs font-medium text-white">
                          {(r.heure as string)?.slice(0, 5)} — {SERVICE_SHORT[r.service as string] ?? r.service as string}
                        </p>
                        {client && (
                          <p className="mt-0.5 truncate text-xs text-neutral-400">
                            {client.prenom} {client.nom}
                          </p>
                        )}
                        {chauffeur && (
                          <p className="mt-0.5 truncate text-xs text-neutral-500">{chauffeur.nom}</p>
                        )}
                        <div className="mt-1">
                          <Badge variant={variant} className="text-[10px] px-1 py-0">
                            {(r.montant as number).toLocaleString()} {r.currency as string}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
