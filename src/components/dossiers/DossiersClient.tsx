'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, FolderOpen, Banknote, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import DossierForm from './DossierForm'
import { deleteDossierAction, encaisserDossierAction } from '@/app/actions/dossiers'
import type { Client } from '@/types/database'

const STATUT_LABELS: Record<string, { label: string; cls: string }> = {
  ouvert: { label: 'En cours', cls: 'bg-amber-900/30 text-amber-400 border border-amber-900/40' },
  ferme: { label: 'Terminé', cls: 'bg-neutral-800 text-neutral-400 border border-neutral-700' },
  archive: { label: 'Archivé', cls: 'bg-neutral-800 text-neutral-500 border border-neutral-700' },
}

type FilterTab = 'all' | 'ouvert' | 'ferme' | 'archive'

interface DossiersClientProps {
  initialDossiers: Record<string, unknown>[]
  clients: Client[]
}

function EncaisserModal({ dossier, onClose, onSuccess }: {
  dossier: Record<string, unknown>
  onClose: () => void
  onSuccess: (id: string, newMontant: number) => void
}) {
  const [montant, setMontant] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const montantPercu = (dossier.montant_percu as number) ?? 0
  const total = (dossier.total_dossier as number) ?? 0
  const restant = Math.max(0, total - montantPercu)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const m = parseFloat(montant)
    if (!m || m <= 0) { setError('Montant invalide'); return }
    setLoading(true)
    setError('')
    const result = await encaisserDossierAction(dossier.id as string, m)
    setLoading(false)
    if (result.error) setError(result.error)
    else { onSuccess(dossier.id as string, result.montant_percu ?? montantPercu + m); onClose() }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Dossier</span>
          <span className="font-medium text-white">{dossier.nom as string}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Total dossier</span>
          <span className="font-medium text-white">€{Math.round(total).toLocaleString('fr-FR')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Déjà encaissé</span>
          <span className="font-medium text-[#C9A060]">€{Math.round(montantPercu).toLocaleString('fr-FR')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Restant à encaisser</span>
          <span className="font-semibold text-amber-400">€{Math.round(restant).toLocaleString('fr-FR')}</span>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-400">Montant à encaisser</label>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2">
          <input type="number" step="0.01" min="0.01" value={montant} onChange={(e) => setMontant(e.target.value)}
            placeholder="0.00" className="flex-1 bg-transparent text-sm text-white outline-none" autoFocus />
          <span className="text-sm text-neutral-500">€</span>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1"><Banknote size={14} />Enregistrer</Button>
      </div>
    </form>
  )
}

const STATUT_RESA: Record<string, string> = {
  confirmed: 'Att. paiement',
  paid: 'Payé',
  devis: 'Devis',
  pending: 'En attente',
  part_paid: 'Acompte',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export default function DossiersClient({ initialDossiers, clients }: DossiersClientProps) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDossier, setEditDossier] = useState<Record<string, unknown> | undefined>()
  const [encaisserDossier, setEncaisserDossier] = useState<Record<string, unknown> | undefined>()
  const [expandedResas, setExpandedResas] = useState<Record<string, boolean>>({})

  const filtered = dossiers.filter((d) =>
    filterTab === 'all' || d.statut === filterTab
  )

  function openCreate() { setEditDossier(undefined); setModalOpen(true) }
  function openEdit(d: Record<string, unknown>) { setEditDossier(d); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce dossier ? Les réservations associées ne seront pas supprimées.')) return
    await deleteDossierAction(id)
    setDossiers((prev) => prev.filter((d) => d.id !== id))
  }

  function handleEncaisserSuccess(id: string, newMontant: number) {
    setDossiers((prev) => prev.map((d) => d.id === id ? { ...d, montant_percu: newMontant } : d))
  }

  const TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'ouvert', label: 'En cours' },
    { value: 'ferme', label: 'Terminés' },
    { value: 'archive', label: 'Archivés' },
  ]

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dossiers</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouveau dossier</Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setFilterTab(tab.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${filterTab === tab.value ? 'border-[#C9A060] text-[#C9A060]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen}
          title={filterTab !== 'all' ? 'Aucun dossier dans cette catégorie' : 'Aucun dossier'}
          description={filterTab === 'all' ? 'Regroupez vos réservations par événement ou client' : undefined}
          action={filterTab === 'all' ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouveau dossier</Button> : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((d) => {
            const client = d.client as Record<string, string> | null
            const resas = (d.reservations as Record<string, unknown>[]) ?? []
            const total = (d.total_dossier as number) ?? 0
            const montantPercu = (d.montant_percu as number) ?? 0
            const restant = Math.max(0, total - montantPercu)
            const allPaid = resas.length > 0 && resas.every((r) => r.statut === 'paid' || r.statut === 'completed')
            const statutCfg = STATUT_LABELS[d.statut as string] ?? STATUT_LABELS.ouvert
            const isExpanded = expandedResas[d.id as string] ?? false

            return (
              <div key={d.id as string} className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base"
                      style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', fontSize: 18 }}>
                      ◧
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white">{d.nom as string}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {client ? `${client.prenom} ${client.nom}` : '—'} · {resas.length} réservation{resas.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${allPaid ? 'bg-[#C9A060]/10 text-[#C9A060] border border-[#C9A060]/30' : statutCfg.cls}`}>
                      {allPaid ? 'Soldé' : statutCfg.label}
                    </span>
                    <button onClick={() => setEncaisserDossier(d)}
                      className="flex items-center gap-1.5 rounded-lg border border-green-900/50 px-2.5 py-1.5 text-xs text-green-400 transition hover:bg-green-950/20">
                      <Banknote size={12} /> Encaisser
                    </button>
                    <button onClick={() => openEdit(d)}
                      className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 transition hover:border-neutral-700 hover:text-white">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(d.id as string)}
                      className="rounded-lg border border-neutral-800 p-1.5 text-neutral-500 transition hover:border-red-900/50 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-800">
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Réservations</div>
                    <div className="text-lg font-semibold text-white">{resas.length}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Total dossier</div>
                    <div className="text-lg font-semibold text-green-400">€{Math.round(total).toLocaleString('fr-FR')}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Encaissé</div>
                    <div className="text-lg font-semibold text-[#C9A060]">€{Math.round(montantPercu).toLocaleString('fr-FR')}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-xs text-neutral-500 mb-1.5">Restant</div>
                    <div className={`text-lg font-semibold ${restant > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      €{Math.round(restant).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Réservations */}
                {resas.length > 0 && (
                  <div className="border-t border-neutral-800">
                    <button
                      onClick={() => setExpandedResas((prev) => ({ ...prev, [d.id as string]: !isExpanded }))}
                      className="flex w-full items-center justify-between px-4 py-2 text-xs text-neutral-400 hover:text-neutral-300 transition"
                    >
                      <span>Voir les réservations</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-neutral-800/60 px-4 pb-3">
                        {resas.map((r, idx) => (
                          <div key={r.id as string ?? idx} className="flex items-center gap-3 py-2 text-xs">
                            <span className="w-[70px] text-neutral-500 flex-shrink-0">{r.date as string ?? '—'}</span>
                            <span className="flex-1 text-white">
                              {r.service as string ?? '—'}
                              {!!r.depart && !!r.destination && (
                                <span className="text-neutral-500"> · {(r.depart as string).split(',')[0]} → {(r.destination as string).split(',')[0]}</span>
                              )}
                              {!!r.resto && (
                                <span className="text-neutral-500"> · {r.resto as string}</span>
                              )}
                            </span>
                            <Badge variant={r.statut === 'paid' || r.statut === 'completed' ? 'success' : r.statut === 'confirmed' ? 'warning' : 'default'}>
                              {STATUT_RESA[r.statut as string] ?? r.statut as string}
                            </Badge>
                            <span className="text-green-400 font-medium w-[70px] text-right">
                              €{Math.round((r.montant as number) ?? 0).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {!!(d.notes as string) && (
                  <div className="border-t border-neutral-800 px-4 py-2.5">
                    <p className="text-xs text-neutral-500">📝 {d.notes as string}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editDossier ? 'Modifier le dossier' : 'Nouveau dossier'} size="md">
        <DossierForm dossier={editDossier} clients={clients} onSuccess={handleSuccess} />
      </Modal>

      {encaisserDossier && (
        <Modal open={!!encaisserDossier} onClose={() => setEncaisserDossier(undefined)}
          title="Encaisser un paiement" size="sm">
          <EncaisserModal
            dossier={encaisserDossier}
            onClose={() => setEncaisserDossier(undefined)}
            onSuccess={handleEncaisserSuccess}
          />
        </Modal>
      )}
    </div>
  )
}
