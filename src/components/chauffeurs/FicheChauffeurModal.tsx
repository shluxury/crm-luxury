'use client'

import { useEffect, useState } from 'react'
import { X, Phone, Mail, Globe, Car, CalendarDays, BarChart2, TrendingUp, Clock, CalendarPlus } from 'lucide-react'
import { getChauffeurMissions } from '@/app/actions/chauffeurs'
import type { ChauffeurFicheData } from '@/app/actions/chauffeurs'
import type { Chauffeur } from '@/types/database'

type ChauffeurWithStats = Chauffeur & { missions_mois: number }

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  devis:     { bg: 'rgba(201,168,76,0.15)',  color: '#C9A060', label: 'Devis' },
  confirmed: { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: 'Confirmé' },
  paid:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: 'Payé' },
  part_paid: { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', label: 'Partiel' },
  completed: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'Terminé' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Annulé' },
}

const STATUT_CHAUFFEUR = {
  disponible:   { color: '#4ade80', dot: '#4ade80', label: 'Disponible' },
  en_mission:   { color: '#fbbf24', dot: '#fbbf24', label: 'En mission' },
  indisponible: { color: '#6b7280', dot: '#6b7280', label: 'Congé / Off' },
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}

interface FicheChauffeurModalProps {
  chauffeur: ChauffeurWithStats
  onClose: () => void
  onEdit: (c: Chauffeur) => void
}

export default function FicheChauffeurModal({ chauffeur, onClose, onEdit }: FicheChauffeurModalProps) {
  const [fiche, setFiche] = useState<ChauffeurFicheData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'planning' | 'historique'>('planning')

  useEffect(() => {
    setLoading(true)
    getChauffeurMissions(chauffeur.id)
      .then(setFiche)
      .finally(() => setLoading(false))
  }, [chauffeur.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const initials = chauffeur.nom.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()
  const statutConfig = STATUT_CHAUFFEUR[chauffeur.statut as keyof typeof STATUT_CHAUFFEUR] ?? STATUT_CHAUFFEUR.disponible

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative flex h-full w-full max-w-xl flex-col shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-1)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: 'rgba(201,168,76,0.15)', border: '2px solid #C9A060', color: '#C9A060' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white">{chauffeur.nom}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statutConfig.dot }} />
              <span className="text-xs" style={{ color: statutConfig.color }}>{statutConfig.label}</span>
              {chauffeur.numero_vtc && (
                <span className="text-[10px] text-neutral-500">· VTC {chauffeur.numero_vtc}</span>
              )}
            </div>
            {chauffeur.langues.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {chauffeur.langues.map((l) => (
                  <span key={l} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">{l}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => window.location.href = `/reservations`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A060', border: '1px solid rgba(201,168,76,0.3)' }}
              title="Assigner une mission"
            >
              <CalendarPlus size={13} />
            </button>
            {chauffeur.email && (
              <button onClick={() => window.open(`mailto:${chauffeur.email}?subject=Brief mission`)}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-sky-400">
                <Mail size={15} />
              </button>
            )}
            <button onClick={() => onEdit(chauffeur)}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
              <Car size={15} />
            </button>
            <button onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1"><CalendarDays size={12} className="text-neutral-500" /><span className="text-[10px] text-neutral-500">Ce mois</span></div>
            <p className="text-sm font-semibold text-white">{loading ? '…' : (fiche?.missions_mois ?? chauffeur.missions_mois)}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1"><BarChart2 size={12} className="text-neutral-500" /><span className="text-[10px] text-neutral-500">Total</span></div>
            <p className="text-sm font-semibold text-white">{loading ? '…' : (fiche?.missions_total ?? 0)}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={12} className="text-neutral-500" /><span className="text-[10px] text-neutral-500">À venir</span></div>
            <p className="text-sm font-semibold text-white">{loading ? '…' : (fiche?.prochaines.length ?? 0)}</p>
          </div>
        </div>

        {/* Contact rapide */}
        <div className="flex gap-3 px-6 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {chauffeur.tel && (
            <a href={`tel:${chauffeur.tel}`} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition">
              <Phone size={11} /> {chauffeur.tel}
            </a>
          )}
          {chauffeur.email && (
            <a href={`mailto:${chauffeur.email}`} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition truncate">
              <Mail size={11} /> {chauffeur.email}
            </a>
          )}
        </div>

        {/* Onglets */}
        <div className="flex px-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {(['planning', 'historique'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-3 text-xs font-medium transition capitalize"
              style={{
                color: tab === t ? '#C9A060' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid #C9A060' : '2px solid transparent',
              }}
            >
              {t === 'planning'
                ? `Planning (${fiche?.prochaines.length ?? 0})`
                : `Historique (${fiche?.passees.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-neutral-500 text-sm">Chargement...</div>
          ) : (
            <MissionsList
              missions={tab === 'planning' ? (fiche?.prochaines ?? []) : (fiche?.passees ?? [])}
              empty={tab === 'planning' ? 'Aucune mission à venir' : 'Aucun historique'}
              emptyIcon={tab === 'planning' ? CalendarDays : Clock}
            />
          )}
        </div>

        {/* Services fréquents */}
        {fiche && fiche.services_frequents.length > 0 && (
          <div className="flex-shrink-0 px-6 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Services les plus fréquents</p>
            <div className="flex flex-wrap gap-2">
              {fiche.services_frequents.map(({ service, count }) => (
                <span key={service} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <Globe size={10} /> {service}
                  <span className="rounded-full bg-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-300">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MissionsList({
  missions,
  empty,
  emptyIcon: EmptyIcon,
}: {
  missions: { id: string; service: string; date: string; heure: string; depart: string | null; destination: string | null; statut: string; currency: string; montant_percu: number; montant: number }[]
  empty: string
  emptyIcon: React.ComponentType<{size?: number; className?: string}>
}) {
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
        <EmptyIcon size={32} className="mb-3 opacity-50" />
        <p className="text-sm">{empty}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {missions.map((r) => {
        const st = STATUT_COLORS[r.statut] ?? STATUT_COLORS.devis
        const sym = r.currency === 'EUR' ? '€' : r.currency === 'USD' ? '$' : r.currency
        return (
          <div key={r.id}
            className="flex items-center gap-4 rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div className="flex-shrink-0 text-center min-w-[60px]">
              <p className="text-[11px] text-neutral-300 font-medium">{formatDate(r.date)}</p>
              <p className="text-[10px] text-neutral-500">{r.heure}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{r.service}</p>
              {(r.depart || r.destination) && (
                <p className="text-xs text-neutral-500 truncate">
                  {r.depart}{r.depart && r.destination ? ' → ' : ''}{r.destination}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
              <span className="text-xs font-semibold text-white">
                {sym}{Math.round(r.montant_percu || r.montant).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
