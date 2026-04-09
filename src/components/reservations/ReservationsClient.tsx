'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, CalendarDays, Search, Copy, Mail, ChevronDown, Filter, FileText, UserCheck, Receipt, SlidersHorizontal } from 'lucide-react'
import EmailModal from '@/components/emails/EmailModal'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Badge, { statutReservationBadge } from '@/components/ui/Badge'
import ReservationForm from './ReservationForm'
import { deleteReservationAction, duplicateReservationAction, updateFactStatutAction, updateStatutAction } from '@/app/actions/reservations'
import { createFactureFromReservationAction } from '@/app/actions/factures'
import type { Client, Chauffeur, Partenaire } from '@/types/database'
import { useSettings } from '@/components/providers/SettingsProvider'

const STATUTS = [
  { value: 'devis', label: 'Devis' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'paid', label: 'Payé' },
  { value: 'part_paid', label: 'Acompte' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

// Couleur de la barre latérale gauche selon statut
function statutBorderColor(statut: string) {
  switch (statut) {
    case 'paid': case 'completed': return '#48c78e'
    case 'part_paid': return '#3e8ed0'
    case 'confirmed': return '#C9A060'
    case 'cancelled': return '#888'
    default: return '#bbb'
  }
}

// Lettre + couleur de fond selon service
function serviceCell(service: string) {
  const svc = (service ?? '').toLowerCase()
  const isHelico = svc.includes('hélic') || svc.includes('helic') || svc.includes('helicopt')
  const isJet = svc.includes('jet') || svc.includes('charter')
  const isAirport = svc.includes('aéroport') || svc.includes('aeroport') || svc.includes('airport') || svc === 'transfert_aeroport'
  const isMad = svc.includes('disposition') || svc.includes('mise') || svc === 'mise_a_disposition'
  const isResto = svc.includes('restaurant') || svc.includes('resto')
  const isLocation = svc.includes('location') || svc.includes('voiture')
  if (isHelico) return { letter: 'H', color: '#2563eb' }
  if (isJet)    return { letter: 'J', color: '#1e40af' }
  if (isAirport) return { letter: 'A', color: '#b45309' }
  if (isMad)    return { letter: 'M', color: '#15803d' }
  if (isResto)  return { letter: 'R', color: '#7c3aed' }
  if (isLocation) return { letter: 'L', color: '#be185d' }
  return { letter: 'T', color: '#475569' }
}

function StatutDropdown({ statut, reservationId, onUpdate }: {
  statut: string
  reservationId: string
  onUpdate: (id: string, newStatut: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { label, variant } = statutReservationBadge(statut)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSelect(value: string) {
    if (value === statut) { setOpen(false); return }
    let cancelReason: string | undefined
    if (value === 'cancelled') {
      const reason = prompt('Raison d\'annulation (optionnel) :') ?? ''
      cancelReason = reason
    }
    setLoading(true)
    setOpen(false)
    await updateStatutAction(reservationId, value, cancelReason)
    onUpdate(reservationId, value)
    setLoading(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1 opacity-90 hover:opacity-100 transition"
      >
        <Badge variant={variant}>{label}</Badge>
        <ChevronDown size={11} className="text-neutral-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-xl border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSelect(s.value)}
              className={`w-full px-3 py-1.5 text-left text-xs transition hover:bg-neutral-800 ${
                s.value === statut ? 'text-[#C9A060]' : 'text-neutral-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionsDropdown({ r, onEdit, onDelete, onDuplicate, onEmail, onFacturer }: {
  r: Record<string, unknown>
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onEmail: () => void
  onFacturer: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-[#C9A060] hover:text-[#C9A060] transition"
      >
        Actions <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
          <button onClick={() => { window.open(`/api/pdf/bon-mission/${r.id}`, '_blank'); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
            <FileText size={12} /> Bon de mission
          </button>
          <button onClick={() => { window.open(`/api/pdf/panneau/${r.id}`, '_blank'); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
            <UserCheck size={12} /> Panneau d&apos;accueil
          </button>
          {(r.fact_statut as string) !== 'facture' && (
            <button onClick={() => { onFacturer(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
              <Receipt size={12} /> Facturer
            </button>
          )}
          <button onClick={() => { onEmail(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
            <Mail size={12} /> Envoyer email
          </button>
          <div className="my-1 border-t border-neutral-800" />
          <button onClick={() => { onEdit(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
            <Pencil size={12} /> Modifier
          </button>
          <button onClick={() => { onDuplicate(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-300 transition hover:bg-neutral-800">
            <Copy size={12} /> Dupliquer
          </button>
          <button onClick={() => { onDelete(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 transition hover:bg-red-950/30">
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

const FACT_STATUT: Record<string, { label: string; cls: string; icon: string }> = {
  non_facture: { label: '', icon: '⬜', cls: 'text-neutral-500' },
  a_facturer:  { label: 'À fact.', icon: '🔴', cls: 'text-red-400' },
  facture:     { label: 'Fact.', icon: '✅', cls: 'text-green-400' },
}

const SERVICE_LABELS: Record<string, string> = {
  transfert_aeroport: 'Transfert aéroport',
  transfert_simple: 'Transfert simple',
  mise_a_disposition: 'Mise à disposition',
  helicoptere: 'Hélicoptère',
  jet_prive: 'Jet privé',
  restaurant: 'Restaurant',
  location_voiture: 'Location voiture',
}

interface ReservationsClientProps {
  initialReservations: Record<string, unknown>[]
  clients: Client[]
  chauffeurs: Chauffeur[]
  partenaires: Partenaire[]
  dossiers: { id: string; nom: string }[]
}

type FilterTab = 'all' | 'confirmed' | 'devis' | 'completed' | 'cancelled'

export default function ReservationsClient({ initialReservations, clients, chauffeurs, partenaires, dossiers }: ReservationsClientProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [filterService, setFilterService] = useState('')
  const [filterEntite, setFilterEntite] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortKey, setSortKey] = useState<'date' | 'id'>('date')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editResa, setEditResa] = useState<Record<string, unknown> | undefined>()
  const [emailResa, setEmailResa] = useState<Record<string, unknown> | undefined>()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const { entites } = useSettings()
  const entitesActives = entites.filter((e) => e.actif)
  const todayStr = new Date().toISOString().slice(0, 10)

  const filtered = reservations
    .filter((r) => {
      const client = r.client as Record<string, string> | null
      const q = search.toLowerCase()
      const matchSearch = !q ||
        `${client?.prenom ?? ''} ${client?.nom ?? ''}`.toLowerCase().includes(q) ||
        (r.depart as string ?? '').toLowerCase().includes(q) ||
        (r.destination as string ?? '').toLowerCase().includes(q) ||
        (r.num_vol as string ?? '').toLowerCase().includes(q) ||
        (r.ref_partenaire as string ?? '').toLowerCase().includes(q) ||
        (r.service as string ?? '').toLowerCase().includes(q)

      // Tab filter
      const rDate = r.date as string ?? ''
      const isPast = rDate && rDate < todayStr
      let matchTab = true
      if (filterTab === 'cancelled') matchTab = r.statut === 'cancelled'
      else if (filterTab === 'devis') matchTab = r.statut === 'devis'
      else if (filterTab === 'completed') matchTab = !!isPast && r.statut !== 'cancelled'
      else if (filterTab === 'confirmed') matchTab = r.statut === 'confirmed' && !isPast
      else matchTab = !isPast && r.statut !== 'cancelled' && r.statut !== 'devis' // 'all' = upcoming

      const matchService = !filterService || r.service === filterService
      const matchEntite = !filterEntite || r.entite === filterEntite
      const matchDateFrom = !filterDateFrom || (rDate >= filterDateFrom)
      const matchDateTo = !filterDateTo || (rDate <= filterDateTo)

      return matchSearch && matchTab && matchService && matchEntite && matchDateFrom && matchDateTo
    })
    .sort((a, b) => {
      if (sortKey === 'date') {
        const da = (a.date as string) ?? ''
        const db = (b.date as string) ?? ''
        if (da !== db) return da < db ? sortDir : -sortDir
        const ha = (a.heure as string) ?? ''
        const hb = (b.heure as string) ?? ''
        return ha < hb ? sortDir : -sortDir
      }
      return 0
    })

  function toggleSort(key: 'date' | 'id') {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(-1) }
  }

  function openCreate() { setEditResa(undefined); setModalOpen(true) }
  function openEdit(r: Record<string, unknown>) { setEditResa(r); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    await deleteReservationAction(id)
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleDuplicate(id: string) {
    await duplicateReservationAction(id)
    window.location.reload()
  }

  function handleStatutUpdate(id: string, newStatut: string) {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, statut: newStatut } : r))
  }

  async function handleFacturer(id: string) {
    const result = await createFactureFromReservationAction(id)
    if (result.error) { alert(result.error); return }
    if (result.id) window.open(`/api/pdf/facture/${result.id}`, '_blank')
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, fact_statut: 'facture' } : r))
  }

  async function cycleFactStatut(id: string, current: string) {
    const cycle: Record<string, string> = { non_facture: 'a_facturer', a_facturer: 'facture', facture: 'non_facture' }
    const next = cycle[current] ?? 'non_facture'
    await updateFactStatutAction(id, next)
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, fact_statut: next } : r))
  }

  const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'confirmed', label: 'Att. paiement' },
    { value: 'devis', label: 'Devis' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ]

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Réservations</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {filtered.length} / {reservations.length} réservation{reservations.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${showFilters ? 'border-[#C9A060] text-[#C9A060]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
          >
            <SlidersHorizontal size={13} /> Filtres
          </button>
          <Button onClick={openCreate}><Plus size={15} />Nouvelle réservation</Button>
        </div>
      </div>

      {/* Tabs de filtre rapide */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterTab(tab.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              filterTab === tab.value
                ? 'border-[#C9A060] text-[#C9A060]'
                : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 ml-2">
          <Search size={13} className="text-neutral-500 flex-shrink-0" />
          <input type="text" placeholder="Client, trajet, vol, réf..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none" />
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-neutral-500 flex-shrink-0" />
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none">
              <option value="">Tous les services</option>
              {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {entitesActives.length > 1 && (
            <select value={filterEntite} onChange={(e) => setFilterEntite(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none">
              <option value="">Toutes les entités</option>
              {entitesActives.map((e) => <option key={e.id} value={e.id}>{e.nom || e.id}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500">Du</span>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none" />
            <span className="text-xs text-neutral-500">au</span>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none" />
          </div>
          {(filterService || filterEntite || filterDateFrom || filterDateTo) && (
            <button onClick={() => { setFilterService(''); setFilterEntite(''); setFilterDateFrom(''); setFilterDateTo('') }}
              className="text-xs text-neutral-500 hover:text-red-400 transition">
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title={search || filterTab !== 'all' ? 'Aucun résultat' : 'Aucune réservation'}
          description={!search && filterTab === 'all' ? 'Créez votre première réservation' : undefined}
          action={!search && filterTab === 'all' ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouvelle réservation</Button> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="w-[68px] px-3 py-3 text-left text-xs font-medium text-neutral-400">#</th>
                <th className="w-[80px] px-3 py-3 text-left">
                  <button onClick={() => toggleSort('date')} className="text-xs font-medium text-neutral-400 hover:text-[#C9A060] transition">
                    Date {sortKey === 'date' ? (sortDir === -1 ? '↓' : '↑') : '⇅'}
                  </button>
                </th>
                <th className="w-[130px] px-3 py-3 text-left text-xs font-medium text-neutral-400">Client</th>
                <th className="w-[36px] px-0 py-3 text-center text-xs font-medium text-neutral-400">Svc</th>
                <th className="min-w-[160px] px-3 py-3 text-left text-xs font-medium text-neutral-400">Prestation</th>
                <th className="w-[120px] px-3 py-3 text-left text-xs font-medium text-neutral-400">Chauffeur</th>
                <th className="w-[90px] px-3 py-3 text-left text-xs font-medium text-neutral-400">Statut</th>
                <th className="w-[60px] px-3 py-3 text-center text-xs font-medium text-neutral-400">Fact.</th>
                <th className="w-[100px] px-3 py-3 text-right text-xs font-medium text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((r) => {
                const client = r.client as Record<string, string> | null
                const chauffeur = r.chauffeur as Record<string, string> | null
                const partenaire = r.partenaire as Record<string, string> | null
                const factCfg = FACT_STATUT[r.fact_statut as string] ?? FACT_STATUT.non_facture
                const svc = serviceCell(r.service as string)
                const isCancelled = r.statut === 'cancelled'
                const rDate = (r.date as string) ?? ''
                const isPast = rDate && rDate < todayStr && !isCancelled
                const borderColor = statutBorderColor(r.statut as string)
                const isExpanded = expandedRow === (r.id as string)
                const marge = ((r.montant as number) ?? 0) - ((r.cout as number) ?? 0)

                // Build prestation text
                const svcLower = (r.service as string ?? '').toLowerCase()
                const isResto = svcLower.includes('restaurant')
                const isAirport = svcLower.includes('aéroport') || svcLower.includes('aeroport') || r.service === 'transfert_aeroport'
                let prestationMain = ''
                let prestationSub = ''
                if (isResto) {
                  prestationMain = (r.resto as string) ?? '—'
                  if (r.couverts) prestationSub = `${r.couverts} couverts`
                } else {
                  const dep = (r.depart as string) ?? ''
                  const dest = (r.destination as string) ?? ''
                  if (dep && dest) prestationMain = `${dep.split(',')[0]} → ${dest.split(',')[0]}`
                  else if (dep) prestationMain = dep.split(',')[0]
                  else if (dest) prestationMain = dest.split(',')[0]
                  if (isAirport && r.num_vol) prestationSub = r.num_vol as string
                }

                return (
                  <>
                    <tr
                      key={r.id as string}
                      className={`cursor-pointer transition ${isCancelled ? 'opacity-50' : isPast ? 'opacity-60' : ''} ${isExpanded ? 'bg-neutral-900/80' : 'bg-neutral-950 hover:bg-neutral-900/50'}`}
                      style={{ borderLeft: `3px solid ${borderColor}` }}
                      onClick={() => setExpandedRow(isExpanded ? null : (r.id as string))}
                    >
                      <td className="px-3 py-2.5 text-xs font-mono text-[#C9A060] align-middle">
                        {(r.id as string).slice(0, 6).toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="text-xs font-medium text-neutral-200 whitespace-nowrap">
                          {rDate ? new Date(rDate + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                        </div>
                        <div className="text-xs font-semibold text-[#C9A060]">{(r.heure as string)?.slice(0, 5) ?? '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-left">
                        {client ? (
                          <>
                            <div className="text-xs text-neutral-400">{client.prenom}</div>
                            <div className="text-sm font-semibold text-white">{client.nom || client.prenom}</div>
                          </>
                        ) : <span className="text-neutral-600 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 px-0 align-middle" style={{ height: 1 }}>
                        <div className="flex h-full items-center justify-center" style={{ background: svc.color, minHeight: 48 }}>
                          <span className="text-sm font-bold text-white">{svc.letter}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-left align-middle max-w-[160px]">
                        {prestationMain ? (
                          <div className="text-xs font-medium text-white truncate" title={prestationMain}>{prestationMain}</div>
                        ) : null}
                        {prestationSub ? (
                          <div className="text-xs text-neutral-500">{prestationSub}</div>
                        ) : null}
                        {!prestationMain && !prestationSub && <span className="text-neutral-600 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        {chauffeur ? (
                          <>
                            <div className="text-xs font-semibold text-[#C9A060] uppercase tracking-wide">
                              {partenaire ? `PART. · ${partenaire.nom}` : 'INTERNE'}
                            </div>
                            <div className="text-xs font-medium text-white mt-0.5">{chauffeur.nom}</div>
                          </>
                        ) : (
                          <span className="text-neutral-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        <StatutDropdown
                          statut={r.statut as string}
                          reservationId={r.id as string}
                          onUpdate={handleStatutUpdate}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => cycleFactStatut(r.id as string, r.fact_statut as string)}
                          className={`text-base transition hover:opacity-70 ${factCfg.cls}`}
                          title="Cliquer pour changer le statut de facturation">
                          {factCfg.icon}
                          {factCfg.label && <div className="text-[9px] font-semibold leading-tight">{factCfg.label}</div>}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                        <ActionsDropdown
                          r={r}
                          onEdit={() => openEdit(r)}
                          onDelete={() => handleDelete(r.id as string)}
                          onDuplicate={() => handleDuplicate(r.id as string)}
                          onEmail={() => setEmailResa(r)}
                          onFacturer={() => handleFacturer(r.id as string)}
                        />
                      </td>
                    </tr>
                    {/* Panneau détail expandable */}
                    {isExpanded && (
                      <tr key={`${r.id}-detail`} className="bg-neutral-900/50">
                        <td colSpan={9} className="px-6 py-3 text-xs">
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <span className="text-neutral-500">Montant TTC</span>
                              <div className="text-base font-semibold text-white mt-0.5">
                                {((r.montant as number) ?? 0).toLocaleString('fr-FR')} {r.currency as string}
                              </div>
                            </div>
                            {marge > 0 && (
                              <div>
                                <span className="text-neutral-500">Marge nette</span>
                                <div className="text-base font-semibold text-green-400 mt-0.5">
                                  {marge.toLocaleString('fr-FR')} {r.currency as string}
                                </div>
                              </div>
                            )}
                            {!!r.mode_paiement && (
                              <div>
                                <span className="text-neutral-500">Mode de paiement</span>
                                <div className="text-sm font-medium text-white mt-0.5">{r.mode_paiement as string}</div>
                              </div>
                            )}
                            {r.montant_percu != null && (r.montant_percu as number) > 0 && (
                              <div>
                                <span className="text-neutral-500">Montant perçu</span>
                                <div className="text-sm font-medium text-green-400 mt-0.5">
                                  {(r.montant_percu as number).toLocaleString('fr-FR')} {r.currency as string}
                                </div>
                              </div>
                            )}
                            {!!r.ref_partenaire && (
                              <div>
                                <span className="text-neutral-500">Réf. partenaire</span>
                                <div className="text-sm font-medium text-white mt-0.5">{r.ref_partenaire as string}</div>
                              </div>
                            )}
                            {!!r.notes && (
                              <div className="flex-1 min-w-[200px]">
                                <span className="text-neutral-500">Notes</span>
                                <div className="text-sm text-neutral-300 italic mt-0.5">{r.notes as string}</div>
                              </div>
                            )}
                            {!!r.num_vol && (
                              <div>
                                <span className="text-neutral-500">Vol</span>
                                <div className="text-sm font-medium text-sky-400 mt-0.5">{r.num_vol as string}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {emailResa && (
        <EmailModal
          open={!!emailResa}
          onClose={() => setEmailResa(undefined)}
          reservationId={emailResa.id as string}
          clientEmail={(emailResa.client as Record<string, string> | null)?.email ?? ''}
          clientNom={emailResa.client ? `${(emailResa.client as Record<string, string>).prenom} ${(emailResa.client as Record<string, string>).nom}` : ''}
          chauffeurEmail={(emailResa.chauffeur as Record<string, string> | null)?.email ?? ''}
          chauffeurNom={(emailResa.chauffeur as Record<string, string> | null)?.nom ?? ''}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editResa ? 'Modifier la réservation' : 'Nouvelle réservation'} size="xl">
        <ReservationForm
          reservation={editResa}
          clients={clients}
          chauffeurs={chauffeurs}
          partenaires={partenaires}
          dossiers={dossiers}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  )
}
