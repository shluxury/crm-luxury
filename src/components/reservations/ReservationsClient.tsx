'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, CalendarDays, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Badge, { statutReservationBadge } from '@/components/ui/Badge'
import ReservationForm from './ReservationForm'
import { deleteReservationAction } from '@/app/actions/reservations'
import type { Client, Chauffeur, Partenaire } from '@/types/database'

const SERVICE_LABELS: Record<string, string> = {
  transfert_aeroport: 'Transfert aéroport',
  transfert_simple: 'Transfert simple',
  mise_a_disposition: 'Mise à dispo.',
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
}

export default function ReservationsClient({ initialReservations, clients, chauffeurs, partenaires }: ReservationsClientProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editResa, setEditResa] = useState<Record<string, unknown> | undefined>()

  const filtered = reservations.filter((r) => {
    const client = r.client as Record<string, string> | null
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${client?.prenom ?? ''} ${client?.nom ?? ''}`.toLowerCase().includes(q) ||
      (r.depart as string ?? '').toLowerCase().includes(q) ||
      (r.destination as string ?? '').toLowerCase().includes(q) ||
      (r.num_vol as string ?? '').toLowerCase().includes(q)
    const matchStatut = !filterStatut || r.statut === filterStatut
    return matchSearch && matchStatut
  })

  function openCreate() { setEditResa(undefined); setModalOpen(true) }
  function openEdit(r: Record<string, unknown>) { setEditResa(r); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    await deleteReservationAction(id)
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Réservations</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{reservations.length} réservation{reservations.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouvelle réservation</Button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <Search size={15} className="text-neutral-500" />
          <input type="text" placeholder="Client, départ, destination, vol..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <Filter size={14} className="text-neutral-500" />
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
            className="bg-transparent text-sm text-white outline-none">
            <option value="">Tous les statuts</option>
            <option value="devis">Devis</option>
            <option value="confirmed">Confirmé</option>
            <option value="paid">Payé</option>
            <option value="part_paid">Partiel</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title={search || filterStatut ? 'Aucun résultat' : 'Aucune réservation'}
          description={!search && !filterStatut ? 'Créez votre première réservation' : undefined}
          action={!search && !filterStatut ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouvelle réservation</Button> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Trajet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((r) => {
                const client = r.client as Record<string, string> | null
                const { label, variant } = statutReservationBadge(r.statut as string)
                const marge = (r.montant as number) - (r.cout as number)

                return (
                  <tr key={r.id as string} className="group bg-neutral-950 transition hover:bg-neutral-900">
                    <td className="px-4 py-3 text-neutral-300">
                      <p className="font-medium">{format(new Date(r.date as string), 'dd MMM', { locale: fr })}</p>
                      <p className="text-xs text-neutral-500">{(r.heure as string)?.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {client ? (
                        <p className="font-medium text-white">{client.prenom} {client.nom}</p>
                      ) : <span className="text-neutral-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {SERVICE_LABELS[r.service as string] ?? r.service as string}
                      {!!r.num_vol && <p className="text-xs text-neutral-500">{r.num_vol as string}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {r.depart || r.destination ? (
                        <p className="truncate text-xs text-neutral-400">
                          {r.depart as string}{r.depart && r.destination ? ' → ' : ''}{r.destination as string}
                        </p>
                      ) : <span className="text-neutral-600">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {(r.montant as number).toLocaleString()} {r.currency as string}
                      </p>
                      {marge > 0 && (
                        <p className="text-xs text-green-500">+{marge.toLocaleString()} marge</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(r.id as string)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editResa ? 'Modifier la réservation' : 'Nouvelle réservation'} size="xl">
        <ReservationForm
          reservation={editResa}
          clients={clients}
          chauffeurs={chauffeurs}
          partenaires={partenaires}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  )
}
