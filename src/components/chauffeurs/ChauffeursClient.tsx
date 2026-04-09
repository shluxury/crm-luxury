'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Car } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import ChauffeurForm from './ChauffeurForm'
import { deleteChauffeurAction } from '@/app/actions/chauffeurs'
import type { Chauffeur } from '@/types/database'

const statutConfig = {
  disponible: { label: 'Disponible', variant: 'success' as const },
  indisponible: { label: 'Indisponible', variant: 'danger' as const },
  en_mission: { label: 'En mission', variant: 'gold' as const },
}

export default function ChauffeursClient({ initialChauffeurs }: { initialChauffeurs: Chauffeur[] }) {
  const [chauffeurs, setChauffeurs] = useState(initialChauffeurs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editChauffeur, setEditChauffeur] = useState<Chauffeur | undefined>()

  function openCreate() { setEditChauffeur(undefined); setModalOpen(true) }
  function openEdit(c: Chauffeur) { setEditChauffeur(c); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce chauffeur ?')) return
    await deleteChauffeurAction(id)
    setChauffeurs((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Chauffeurs</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{chauffeurs.length} chauffeur{chauffeurs.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Ajouter</Button>
      </div>

      {chauffeurs.length === 0 ? (
        <EmptyState icon={Car} title="Aucun chauffeur" description="Ajoutez votre premier chauffeur"
          action={<Button size="sm" onClick={openCreate}><Plus size={13} />Ajouter</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chauffeurs.map((c) => {
            const statut = statutConfig[c.statut as keyof typeof statutConfig] ?? statutConfig.disponible
            return (
              <div key={c.id} className="group rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium text-neutral-300">
                      {c.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{c.nom}</p>
                      {c.numero_vtc && <p className="text-xs text-neutral-500">{c.numero_vtc}</p>}
                    </div>
                  </div>
                  <Badge variant={statut.variant}>{statut.label}</Badge>
                </div>

                {(c.tel || c.email) && (
                  <div className="mb-3 space-y-1 text-xs text-neutral-400">
                    {c.tel && <p>{c.tel}</p>}
                    {c.email && <p>{c.email}</p>}
                  </div>
                )}

                {c.langues.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {c.langues.map((l) => (
                      <span key={l} className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">{l}</span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editChauffeur ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}>
        <ChauffeurForm chauffeur={editChauffeur} onSuccess={handleSuccess} />
      </Modal>
    </div>
  )
}
