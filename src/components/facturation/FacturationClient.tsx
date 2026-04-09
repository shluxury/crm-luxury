'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import FactureForm from './FactureForm'
import { deleteFactureAction } from '@/app/actions/factures'
import type { Client } from '@/types/database'

const STATUT_CONFIG: Record<string, { variant: 'default' | 'warning' | 'success'; label: string }> = {
  draft: { variant: 'default', label: 'Brouillon' },
  sent: { variant: 'warning', label: 'Envoyée' },
  paid: { variant: 'success', label: 'Payée' },
}

const MODE_LABELS: Record<string, string> = {
  sumup: 'SumUp',
  stripe: 'Stripe',
  tpe: 'TPE',
  virement_fr: 'Virement FR',
  virement_dubai: 'Virement Dubai',
  especes: 'Espèces',
  currenxie_us_usd: 'Currenxie US',
  currenxie_uk_eur: 'Currenxie UK',
  currenxie_hk_hkd: 'Currenxie HK',
  currenxie_hk_eur: 'Currenxie HK/EUR',
}

interface FacturationClientProps {
  initialFactures: Record<string, unknown>[]
  clients: Client[]
}

export default function FacturationClient({ initialFactures, clients }: FacturationClientProps) {
  const [factures, setFactures] = useState(initialFactures)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editFacture, setEditFacture] = useState<Record<string, unknown> | undefined>()

  const filtered = factures.filter((f) => {
    const client = f.client as Record<string, string> | null
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (f.numero as string).toLowerCase().includes(q) ||
      `${client?.prenom ?? ''} ${client?.nom ?? ''}`.toLowerCase().includes(q)
    const matchStatut = !filterStatut || f.statut === filterStatut
    return matchSearch && matchStatut
  })

  const totalPaid = factures
    .filter((f) => f.statut === 'paid')
    .reduce((sum, f) => sum + (f.montant as number), 0)

  function openCreate() { setEditFacture(undefined); setModalOpen(true) }
  function openEdit(f: Record<string, unknown>) { setEditFacture(f); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); window.location.reload() }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    await deleteFactureAction(id)
    setFactures((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Facturation</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {factures.length} facture{factures.length > 1 ? 's' : ''}
            {totalPaid > 0 && <span className="ml-2 text-[#C9A060]">{totalPaid.toLocaleString()} € perçus</span>}
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouvelle facture</Button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <Search size={15} className="text-neutral-500" />
          <input type="text" placeholder="Numéro, client..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none">
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyée</option>
          <option value="paid">Payée</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText}
          title={search || filterStatut ? 'Aucun résultat' : 'Aucune facture'}
          description={!search && !filterStatut ? 'Créez votre première facture' : undefined}
          action={!search && !filterStatut ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouvelle facture</Button> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Paiement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filtered.map((f) => {
                const client = f.client as Record<string, string> | null
                const sv = STATUT_CONFIG[f.statut as string] ?? { variant: 'default' as const, label: f.statut as string }
                return (
                  <tr key={f.id as string} className="group transition hover:bg-neutral-900/30">
                    <td className="px-4 py-3 font-mono text-sm text-white">{f.numero as string}</td>
                    <td className="px-4 py-3 text-neutral-300">
                      {client ? `${client.prenom} ${client.nom}` : <span className="text-neutral-600">-</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {f.created_at
                        ? format(new Date(f.created_at as string), 'd MMM yyyy', { locale: fr })
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">
                        {(f.montant as number).toLocaleString()} {f.currency as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">
                      {f.mode_paiement ? MODE_LABELS[f.mode_paiement as string] ?? f.mode_paiement as string : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sv.variant}>{sv.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(f)}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(f.id as string)}
                          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-950/50 hover:text-red-400">
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
        title={editFacture ? 'Modifier la facture' : 'Nouvelle facture'} size="md">
        <FactureForm facture={editFacture} clients={clients} onSuccess={handleSuccess} />
      </Modal>
    </div>
  )
}
