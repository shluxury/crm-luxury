'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Handshake, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import PartenaireForm from './PartenaireForm'
import { deletePartenaireAction } from '@/app/actions/partenaires'
import type { Partenaire } from '@/types/database'

export default function PartenairesClient({ initialPartenaires }: { initialPartenaires: Partenaire[] }) {
  const [partenaires, setPartenaires] = useState(initialPartenaires)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPartenaire, setEditPartenaire] = useState<Partenaire | undefined>()

  const filtered = partenaires.filter((p) => {
    const q = search.toLowerCase()
    return p.nom.toLowerCase().includes(q) || (p.zone ?? '').toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q)
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Partenaires</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Ajouter</Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
        <Search size={15} className="text-neutral-500" />
        <input type="text" placeholder="Rechercher par nom, zone, ville..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Handshake} title={search ? 'Aucun résultat' : 'Aucun partenaire'}
          description={search ? undefined : 'Ajoutez vos sous-traitants et opérateurs'}
          action={!search ? <Button size="sm" onClick={openCreate}><Plus size={13} />Ajouter</Button> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Partenaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">IBAN</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((p) => (
                <tr key={p.id} className="group bg-neutral-950 transition hover:bg-neutral-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{p.nom}</p>
                      {p.has_monaco && <Badge variant="gold">Monaco</Badge>}
                    </div>
                    {p.forme_juridique && <p className="text-xs text-neutral-500">{p.forme_juridique}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    <div>
                      {p.contact && <p className="text-white">{p.contact}</p>}
                      {p.tel && <p className="text-xs text-neutral-500">{p.tel}</p>}
                      {p.email && <p className="text-xs text-neutral-500">{p.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{p.zone ?? '-'}</td>
                  <td className="px-4 py-3">
                    {p.iban ? (
                      <span className="font-mono text-xs text-neutral-400">
                        {p.iban.slice(0, 8)}••••
                      </span>
                    ) : <span className="text-neutral-600">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editPartenaire ? 'Modifier le partenaire' : 'Nouveau partenaire'} size="lg">
        <PartenaireForm partenaire={editPartenaire} onSuccess={handleSuccess} />
      </Modal>
    </div>
  )
}
