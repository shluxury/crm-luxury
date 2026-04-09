'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Car, Phone, Mail, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import ChauffeurForm from './ChauffeurForm'
import FicheChauffeurModal from './FicheChauffeurModal'
import { deleteChauffeurAction, updateStatutChauffeurAction } from '@/app/actions/chauffeurs'
import type { Chauffeur } from '@/types/database'

type ChauffeurWithStats = Chauffeur & { missions_mois: number }

const STATUT_CONFIG = {
  disponible: { label: 'Disponible', color: '#48c78e', dot: 'bg-green-400' },
  en_mission: { label: 'En mission', color: '#fbbf24', dot: 'bg-amber-400' },
  indisponible: { label: 'Congé / Off', color: '#6b7280', dot: 'bg-neutral-500' },
}
const STATUT_NEXT: Record<string, string> = {
  disponible: 'en_mission',
  en_mission: 'indisponible',
  indisponible: 'disponible',
}

function getInitials(nom: string) {
  return nom.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()
}

export default function ChauffeursClient({ initialChauffeurs }: { initialChauffeurs: ChauffeurWithStats[] }) {
  const [chauffeurs, setChauffeurs] = useState(initialChauffeurs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editChauffeur, setEditChauffeur] = useState<Chauffeur | undefined>()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [ficheChauffeur, setFicheChauffeur] = useState<ChauffeurWithStats | null>(null)

  function openCreate() { setEditChauffeur(undefined); setModalOpen(true) }
  function openEdit(c: Chauffeur) { setEditChauffeur(c); setFicheChauffeur(null); setModalOpen(true) }
  function openFiche(c: ChauffeurWithStats) { setFicheChauffeur(c) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce chauffeur ?')) return
    await deleteChauffeurAction(id)
    setChauffeurs((prev) => prev.filter((c) => c.id !== id))
  }

  async function toggleStatut(c: ChauffeurWithStats) {
    const next = STATUT_NEXT[c.statut] ?? 'disponible'
    setTogglingId(c.id)
    await updateStatutChauffeurAction(c.id, next)
    setChauffeurs((prev) => prev.map((x) => x.id === c.id ? { ...x, statut: next } : x))
    setTogglingId(null)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Chauffeurs</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {chauffeurs.length} chauffeur{chauffeurs.length > 1 ? 's' : ''} ·{' '}
            <span className="text-green-400">{chauffeurs.filter((c) => c.statut === 'disponible').length} disponibles</span>
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Ajouter</Button>
      </div>

      {chauffeurs.length === 0 ? (
        <EmptyState icon={Car} title="Aucun chauffeur" description="Ajoutez votre premier chauffeur"
          action={<Button size="sm" onClick={openCreate}><Plus size={13} />Ajouter</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chauffeurs.map((c) => {
            const statut = STATUT_CONFIG[c.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.disponible
            return (
              <div key={c.id} className="group rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A060]/15 text-sm font-semibold text-[#C9A060]"
                      style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
                      {getInitials(c.nom)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{c.nom}</p>
                      {c.numero_vtc && <p className="text-[10px] text-neutral-500">VTC: {c.numero_vtc}</p>}
                    </div>
                  </div>
                </div>

                {/* Statut toggle */}
                <button
                  onClick={() => toggleStatut(c)}
                  disabled={togglingId === c.id}
                  className="mb-3 flex w-full items-center gap-2 rounded-lg border border-neutral-800 px-2 py-1.5 text-xs transition hover:border-neutral-700"
                  title="Cliquer pour changer le statut"
                >
                  <div className={`w-2 h-2 rounded-full ${statut.dot} flex-shrink-0`} />
                  <span style={{ color: statut.color }}>{statut.label}</span>
                </button>

                {/* Infos */}
                <div className="mb-3 space-y-1.5 text-xs text-neutral-400">
                  {c.tel && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} className="flex-shrink-0" />
                      <a href={`tel:${c.tel}`} className="hover:text-white transition">{c.tel}</a>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="flex-shrink-0" />
                      <a href={`mailto:${c.email}`} className="hover:text-white transition truncate">{c.email}</a>
                    </div>
                  )}
                  {c.langues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.langues.map((l) => (
                        <span key={l} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">{l}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats missions */}
                <div className="mb-3 rounded-lg bg-neutral-800/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Missions ce mois</span>
                    <span className="text-sm font-semibold text-white">{c.missions_mois}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openFiche(c)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-800 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-[#C9A060]"
                  >
                    <Eye size={11} /> Fiche
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-800 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white"
                  >
                    <Pencil size={11} /> Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg border border-neutral-800 px-2 py-1.5 text-xs text-neutral-500 transition hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                  >
                    <Trash2 size={12} />
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

      {ficheChauffeur && (
        <FicheChauffeurModal
          chauffeur={ficheChauffeur}
          onClose={() => setFicheChauffeur(null)}
          onEdit={(c) => openEdit(c)}
        />
      )}
    </div>
  )
}
