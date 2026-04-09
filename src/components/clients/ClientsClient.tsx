'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search, Mail, CalendarPlus, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import ClientForm from './ClientForm'
import FicheClientModal from './FicheClientModal'
import TagBadge from '@/components/ui/TagBadge'
import { deleteClientAction } from '@/app/actions/clients'
import type { ClientWithStats } from '@/app/actions/clients'
import type { Client } from '@/types/database'

interface ClientsClientProps {
  initialClients: ClientWithStats[]
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'' | 'particulier' | 'corporate'>('')
  const [filterTag, setFilterTag] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [ficheClient, setFicheClient] = useState<ClientWithStats | null>(null)

  // Tous les tags existants
  const allTags = [...new Set(clients.flatMap((c) => c.tags))].sort()

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.entreprise ?? '').toLowerCase().includes(q) ||
      (c.corp_nom ?? '').toLowerCase().includes(q) ||
      (c.corp_contact_nom ?? '').toLowerCase().includes(q)

    const matchType = !filterType ||
      (filterType === 'corporate' && c.is_corporate) ||
      (filterType === 'particulier' && !c.is_corporate)

    const matchTag = !filterTag || c.tags.includes(filterTag)

    return matchSearch && matchType && matchTag
  })

  function openCreate() {
    setEditClient(undefined)
    setModalOpen(true)
  }

  function openEdit(client: ClientWithStats) {
    // On mappe vers le type Client pour le formulaire
    setEditClient(client as unknown as Client)
    setFicheClient(null)
    setModalOpen(true)
  }

  function openFiche(client: ClientWithStats) {
    setFicheClient(client)
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

  function getAvatar(c: ClientWithStats) {
    if (c.is_corporate && c.corp_nom) return c.corp_nom.charAt(0).toUpperCase()
    return (c.prenom.charAt(0) + c.nom.charAt(0)).toUpperCase()
  }

  function getDisplayName(c: ClientWithStats) {
    if (c.is_corporate && c.corp_nom) return c.corp_nom
    return `${c.prenom} ${c.nom}`
  }

  function getContactDisplay(c: ClientWithStats) {
    if (c.is_corporate) {
      return {
        tel: c.corp_contact_tel || c.tel,
        email: c.corp_contact_email || c.email,
        nom: c.corp_contact_nom || `${c.prenom} ${c.nom}`,
      }
    }
    return { tel: c.tel, email: c.email, nom: null }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {filtered.length} / {clients.length} client{clients.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Nouveau client
        </Button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <Search size={13} className="text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as '' | 'particulier' | 'corporate')}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Tous les types</option>
          <option value="particulier">Particuliers</option>
          <option value="corporate">Corporate</option>
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Tous les tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || filterType || filterTag ? 'Aucun résultat' : 'Aucun client'}
          description={!search && !filterType && !filterTag ? 'Créez votre premier client' : undefined}
          action={!search && !filterType && !filterTag ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouveau client</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Email</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Missions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">CA total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Tags</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((client) => {
                const contact = getContactDisplay(client)
                return (
                  <tr
                    key={client.id}
                    className="group bg-neutral-950 transition hover:bg-neutral-900 cursor-pointer"
                    onClick={() => openFiche(client)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={client.is_corporate
                            ? { background: 'rgba(91,158,224,0.15)', border: '1px solid #5b9ee0', color: '#5b9ee0' }
                            : { background: 'rgba(201,168,76,0.15)', border: '1px solid #C9A060', color: '#C9A060' }
                          }
                        >
                          {getAvatar(client)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{getDisplayName(client)}</p>
                          {client.is_corporate && (
                            <>
                              {contact.nom && <p className="text-xs text-neutral-400">{contact.nom}</p>}
                              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(91,158,224,0.15)', color: '#5b9ee0', border: '1px solid rgba(91,158,224,0.3)' }}>
                                🏢 Corporate
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {contact.tel ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {contact.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      {client.missions_count}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">
                      {client.ca_total > 0 ? `€${Math.round(client.ca_total).toLocaleString('fr-FR')}` : '€0'}
                    </td>
                    <td className="px-4 py-3">
                      {client.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.tags.map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                      ) : <span className="text-neutral-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => openFiche(client)}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-[#C9A060]"
                          title="Voir la fiche"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => {
                            // Ouvrir la page réservation avec ce client pré-sélectionné
                            window.location.href = `/reservations?client_id=${client.id}`
                          }}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-[#C9A060]"
                          title="Nouvelle réservation"
                        >
                          <CalendarPlus size={13} />
                        </button>
                        {contact.email && (
                          <button
                            onClick={() => window.open(`mailto:${contact.email}`)}
                            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-sky-400"
                            title="Envoyer un email"
                          >
                            <Mail size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(client)}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          disabled={deletingId === client.id}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400"
                          title="Supprimer"
                        >
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

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClient ? 'Modifier le client' : 'Nouveau client'}
        size="lg"
      >
        <ClientForm client={editClient} onSuccess={handleSuccess} />
      </Modal>

      {/* Fiche client latérale */}
      {ficheClient && (
        <FicheClientModal
          client={ficheClient}
          onClose={() => setFicheClient(null)}
          onEdit={(c) => {
            setFicheClient(null)
            openEdit(c)
          }}
        />
      )}
    </div>
  )
}
