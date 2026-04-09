'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import ClientForm from './ClientForm'
import { deleteClientAction } from '@/app/actions/clients'
import type { Client } from '@/types/database'

interface ClientsClientProps {
  initialClients: Client[]
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.entreprise ?? '').toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditClient(undefined)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditClient(client)
    setModalOpen(true)
  }

  function handleSuccess() {
    setModalOpen(false)
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    setDeletingId(id)
    await deleteClientAction(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Nouveau client
        </Button>
      </div>

      {/* Recherche */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
        <Search size={15} className="text-neutral-500" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Aucun résultat' : 'Aucun client'}
          description={search ? 'Essayez un autre terme de recherche' : 'Créez votre premier client'}
          action={!search ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouveau client</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Langue</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((client) => (
                <tr key={client.id} className="group bg-neutral-950 transition hover:bg-neutral-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-300">
                        {client.prenom.charAt(0)}{client.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.prenom} {client.nom}</p>
                        {client.entreprise && <p className="text-xs text-neutral-500">{client.entreprise}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {client.email && <p className="text-neutral-300">{client.email}</p>}
                      {client.tel && <p className="text-xs text-neutral-500">{client.tel}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {client.is_corporate ? (
                      <Badge variant="gold">Corporate</Badge>
                    ) : (
                      <Badge>Particulier</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {client.langue === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClient ? 'Modifier le client' : 'Nouveau client'}
        size="lg"
      >
        <ClientForm client={editClient} onSuccess={handleSuccess} />
      </Modal>
    </div>
  )
}
