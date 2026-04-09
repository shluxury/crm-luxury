'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, FolderOpen, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import DossierForm from './DossierForm'
import { deleteDossierAction } from '@/app/actions/dossiers'
import type { Client } from '@/types/database'
import { useSettings } from '@/components/providers/SettingsProvider'

const STATUT_VARIANTS: Record<string, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  ouvert: { variant: 'success', label: 'Ouvert' },
  ferme: { variant: 'default', label: 'Fermé' },
  archive: { variant: 'warning', label: 'Archivé' },
}

interface DossiersClientProps {
  initialDossiers: Record<string, unknown>[]
  clients: Client[]
}

export default function DossiersClient({ initialDossiers, clients }: DossiersClientProps) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const { entites } = useSettings()
  const getEntiteLabel = (id: string) => {
    const e = entites.find((x) => x.id === id)
    if (!e?.nom) return id
    return e.nom.replace(/[^A-Z]/g, '').slice(0, 3) || e.nom.slice(0, 3).toUpperCase()
  }
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDossier, setEditDossier] = useState<Record<string, unknown> | undefined>()

  const filtered = dossiers.filter((d) => {
    const client = d.client as Record<string, string> | null
    const q = search.toLowerCase()
    return !q ||
      (d.nom as string).toLowerCase().includes(q) ||
      `${client?.prenom ?? ''} ${client?.nom ?? ''}`.toLowerCase().includes(q)
  })

  function openCreate() { setEditDossier(undefined); setModalOpen(true) }
  function openEdit(d: Record<string, unknown>) { setEditDossier(d); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce dossier ? Les réservations associées ne seront pas supprimées.')) return
    await deleteDossierAction(id)
    setDossiers((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dossiers</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouveau dossier</Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
        <Search size={15} className="text-neutral-500" />
        <input type="text" placeholder="Rechercher un dossier..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen}
          title={search ? 'Aucun résultat' : 'Aucun dossier'}
          description={!search ? 'Regroupez vos réservations par événement ou client' : undefined}
          action={!search ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouveau dossier</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const client = d.client as Record<string, string> | null
            const sv = STATUT_VARIANTS[d.statut as string] ?? { variant: 'default' as const, label: d.statut as string }
            return (
              <div key={d.id as string}
                className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">{d.nom as string}</p>
                    {client && (
                      <p className="mt-0.5 truncate text-xs text-neutral-400">{client.prenom} {client.nom}</p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-400">
                    {getEntiteLabel(d.entite as string)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={sv.variant}>{sv.label}</Badge>
                    {(d.montant_percu as number) > 0 && (
                      <span className="text-xs font-medium text-[#C9A060]">
                        {(d.montant_percu as number).toLocaleString()} €
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(d)}
                      className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(d.id as string)}
                      className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {(d.notes as string) && (
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{d.notes as string}</p>
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
    </div>
  )
}
