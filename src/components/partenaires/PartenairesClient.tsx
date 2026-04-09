'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Handshake, Search, Mail, Phone, MapPin, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import PartenaireForm from './PartenaireForm'
import { deletePartenaireAction } from '@/app/actions/partenaires'
import type { Partenaire } from '@/types/database'
import type { PartenaireStats } from '@/app/(crm)/partenaires/page'

interface PartenairesClientProps {
  initialPartenaires: Partenaire[]
  statsMap: Record<string, PartenaireStats>
}

type FilterTab = 'all' | 'pending' | 'paid'

export default function PartenairesClient({ initialPartenaires, statsMap }: PartenairesClientProps) {
  const [partenaires, setPartenaires] = useState(initialPartenaires)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [filterMC, setFilterMC] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPartenaire, setEditPartenaire] = useState<Partenaire | undefined>()
  const [fichePartenaire, setFichePartenaire] = useState<Partenaire | undefined>()

  const filtered = partenaires.filter((p) => {
    const stats = statsMap[p.id] ?? { missions_total: 0, missions_mois: 0, ca_total: 0, du_mois: 0 }
    const q = search.toLowerCase()
    const matchSearch = !q || p.nom.toLowerCase().includes(q) || (p.zone ?? '').toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q)
    const matchTab = filterTab === 'all' || (filterTab === 'pending' && stats.du_mois > 0) || (filterTab === 'paid' && stats.du_mois === 0)
    const matchMC = !filterMC || p.has_monaco
    return matchSearch && matchTab && matchMC
  })

  function openCreate() { setEditPartenaire(undefined); setModalOpen(true) }
  function openEdit(p: Partenaire) { setEditPartenaire(p); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce partenaire ?')) return
    await deletePartenaireAction(id)
    setPartenaires((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Partenaires sous-traitants</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouveau partenaire</Button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'pending', 'paid'] as FilterTab[]).map((tab) => (
          <button key={tab} onClick={() => setFilterTab(tab)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${filterTab === tab ? 'border-[#C9A060] text-[#C9A060]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
            {tab === 'all' ? 'Tous' : tab === 'pending' ? 'À payer' : 'Soldé'}
          </button>
        ))}
        <button onClick={() => setFilterMC((v) => !v)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${filterMC ? 'border-[#C9A060] text-[#C9A060]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
          Zone spéciale
        </button>
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 ml-1">
          <Search size={13} className="text-neutral-500 flex-shrink-0" />
          <input type="text" placeholder="Ville de base, nom..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Handshake} title={search || filterTab !== 'all' ? 'Aucun résultat' : 'Aucun partenaire'}
          description={!search && filterTab === 'all' ? 'Ajoutez vos sous-traitants et opérateurs' : undefined}
          action={!search && filterTab === 'all' ? <Button size="sm" onClick={openCreate}><Plus size={13} />Ajouter</Button> : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p) => {
            const stats = statsMap[p.id] ?? { missions_total: 0, missions_mois: 0, ca_total: 0, du_mois: 0 }
            const isPending = stats.du_mois > 0
            return (
              <div key={p.id} className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                {/* Header de la carte */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#C9A060]"
                      style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                      {p.nom.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-white">{p.nom}</span>
                        {p.has_monaco && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A060', border: '1px solid rgba(201,168,76,0.3)' }}>
                            Zone spéciale
                          </span>
                        )}
                      </div>
                      {(p.zone || p.contact) && (
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                          {p.zone && <span className="flex items-center gap-1"><MapPin size={10} />{p.zone}</span>}
                          {p.contact && <span>{p.contact}</span>}
                        </div>
                      )}
                      {p.has_monaco && p.mc_vehicules?.length > 0 && (
                        <div className="mt-1 text-xs text-neutral-500">Véhicules zone spéciale : {p.mc_vehicules.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPending ? (
                      <span className="rounded-md px-2 py-1 text-xs font-semibold bg-red-900/30 text-red-400 border border-red-900/40">
                        Dû : €{Math.round(stats.du_mois).toLocaleString('fr-FR')}
                      </span>
                    ) : (
                      <span className="rounded-md px-2 py-1 text-xs font-semibold bg-green-900/20 text-green-400 border border-green-900/30">
                        Soldé ✓
                      </span>
                    )}
                    {p.tel && (
                      <a href={`tel:${p.tel}`}
                        className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition">
                        <Phone size={11} /> Contact
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`}
                        className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:border-neutral-700 hover:text-sky-400 transition">
                        <Mail size={11} /> Email
                      </a>
                    )}
                    <button onClick={() => openEdit(p)}
                      className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition">
                      <Pencil size={11} /> Éditer
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-500 hover:border-red-900/50 hover:text-red-400 transition">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-neutral-800">
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Missions ce mois</div>
                    <div className="text-xl font-medium text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stats.missions_mois}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">CA coût total</div>
                    <div className="text-xl font-medium text-green-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      €{Math.round(stats.ca_total).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className={`px-4 py-3 ${isPending ? 'bg-red-950/10' : ''}`}>
                    <div className="text-xs text-neutral-500 mb-1.5">Dû ce mois</div>
                    <div className={`text-xl font-medium ${isPending ? 'text-red-400' : 'text-neutral-600'}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {stats.du_mois > 0 ? `€${Math.round(stats.du_mois).toLocaleString('fr-FR')}` : '—'}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Chauffeurs</div>
                    <div className="text-xl font-medium text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-neutral-500" />
                        {p.chauffeurs_list?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liste des chauffeurs */}
                {p.chauffeurs_list && p.chauffeurs_list.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-neutral-800/50 flex flex-wrap gap-1.5">
                    {p.chauffeurs_list.map((chauf) => (
                      <span key={chauf} className="rounded px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 border border-neutral-700">
                        👤 {chauf}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editPartenaire ? 'Modifier le partenaire' : 'Nouveau partenaire'} size="lg">
        <PartenaireForm partenaire={editPartenaire} onSuccess={handleSuccess} />
      </Modal>

      {fichePartenaire && (
        <Modal open={!!fichePartenaire} onClose={() => setFichePartenaire(undefined)}
          title={fichePartenaire.nom} size="md">
          <div className="text-sm text-neutral-400 text-center py-8">Fiche détail — TODO</div>
        </Modal>
      )}
    </div>
  )
}
