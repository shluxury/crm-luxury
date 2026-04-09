'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText, Mail, Printer } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Textarea from '@/components/ui/Textarea'
import FactureForm from './FactureForm'
import { deleteFactureAction, updateFactureStatutAction } from '@/app/actions/factures'
import { sendFactureEmailAction } from '@/app/actions/emails'
import { useSettings } from '@/components/providers/SettingsProvider'
import type { Client } from '@/types/database'

type FilterTab = 'all' | 'draft' | 'sent' | 'paid' | 'retard'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:  { label: 'Draft',      color: '#888888', bg: 'rgba(136,136,136,0.12)', border: 'rgba(136,136,136,0.3)' },
  sent:   { label: 'Envoyée',    color: '#5b9ee0', bg: 'rgba(91,158,224,0.12)', border: 'rgba(91,158,224,0.3)' },
  paid:   { label: 'Payée',      color: '#48c78e', bg: 'rgba(72,199,142,0.12)', border: 'rgba(72,199,142,0.3)' },
  retard: { label: 'En retard',  color: '#e05a5a', bg: 'rgba(224,90,90,0.12)',  border: 'rgba(224,90,90,0.3)' },
}

interface FacturationClientProps {
  initialFactures: Record<string, unknown>[]
  clients: Client[]
}

export default function FacturationClient({ initialFactures, clients }: FacturationClientProps) {
  const router = useRouter()
  const { entites } = useSettings()
  const [factures, setFactures] = useState(initialFactures)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editFacture, setEditFacture] = useState<Record<string, unknown> | undefined>()
  const [emailFacture, setEmailFacture] = useState<{ id: string; email: string; nom: string } | null>(null)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')

  const filtered = factures.filter((f) =>
    filterTab === 'all' || f.statut === filterTab
  )

  const totalPaid = factures
    .filter((f) => f.statut === 'paid')
    .reduce((sum, f) => sum + ((f.montant as number) ?? 0), 0)
  const totalEnRetard = factures
    .filter((f) => f.statut === 'retard')
    .reduce((sum, f) => sum + ((f.montant as number) ?? 0), 0)

  const TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Envoyées' },
    { value: 'paid', label: 'Payées' },
    { value: 'retard', label: 'En retard' },
  ]

  function openCreate() { setEditFacture(undefined); setModalOpen(true) }
  function openEdit(f: Record<string, unknown>) { setEditFacture(f); setModalOpen(true) }
  function handleSuccess() { setModalOpen(false); router.refresh() }

  function openEmailModal(f: Record<string, unknown>) {
    const client = f.client as Record<string, string> | null
    if (!client?.email) return
    setEmailFacture({ id: f.id as string, email: client.email, nom: `${client.prenom} ${client.nom}` })
    setEmailMessage('')
    setEmailError('')
  }

  async function handleSendEmail() {
    if (!emailFacture) return
    setEmailSending(true)
    setEmailError('')
    const result = await sendFactureEmailAction(emailFacture.id, emailFacture.email, emailFacture.nom, emailMessage || undefined)
    setEmailSending(false)
    if (result?.error) {
      setEmailError(result.error)
    } else {
      // Mettre à jour le statut localement si changé
      if (result.newStatut) {
        setFactures((prev) => prev.map((f) => f.id === emailFacture.id ? { ...f, statut: result.newStatut } : f))
      }
      setEmailFacture(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    await deleteFactureAction(id)
    setFactures((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleStatutChange(id: string, statut: string) {
    await updateFactureStatutAction(id, statut)
    setFactures((prev) => prev.map((f) => f.id === id ? { ...f, statut } : f))
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Facturation</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            {factures.length} facture{factures.length > 1 ? 's' : ''}
            {totalPaid > 0 && <span className="ml-2 text-[#C9A060]">· €{Math.round(totalPaid).toLocaleString('fr-FR')} perçus</span>}
            {totalEnRetard > 0 && <span className="ml-2 text-red-400">· €{Math.round(totalEnRetard).toLocaleString('fr-FR')} en retard</span>}
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />Nouvelle facture</Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setFilterTab(tab.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              filterTab === tab.value ? 'border-[#C9A060] text-[#C9A060]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText}
          title={filterTab !== 'all' ? 'Aucune facture dans cette catégorie' : 'Aucune facture'}
          description={filterTab === 'all' ? 'Créez votre première facture' : undefined}
          action={filterTab === 'all' ? <Button size="sm" onClick={openCreate}><Plus size={13} />Nouvelle facture</Button> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">N° Facture</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Prestation</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Entité</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filtered.map((f) => {
                const client = f.client as Record<string, string> | null
                const reservation = f.reservation as Record<string, string> | null
                const statut = f.statut as string
                const statutCfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.draft
                const rowBg = statut === 'retard' ? 'rgba(224,90,90,0.06)' : statut === 'paid' ? 'rgba(72,199,142,0.04)' : ''
                const dateDisp = (f.created_at as string)
                  ? new Date(f.created_at as string).toLocaleDateString('fr-FR')
                  : '—'
                // Service from reservation or notes
                const serviceLabel = reservation?.service
                  ? reservation.service.charAt(0).toUpperCase() + reservation.service.slice(1).replace(/_/g, ' ')
                  : '—'
                const entiteLabel = entites.find((e) => e.id === (f.entite as string))?.nom || (f.entite as string)
                return (
                  <tr key={f.id as string} style={{ background: rowBg }}
                    className="border-b border-neutral-800/50 transition hover:bg-neutral-900/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-[#C9A060]">{f.numero as string}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {client ? `${client.prenom} ${client.nom}` : <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-xs text-neutral-400">
                      {serviceLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">
                        {Math.round((f.montant as number) ?? 0).toLocaleString('fr-FR')}
                      </span>
                      <span className="ml-1 text-xs text-neutral-500">{f.currency as string}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'rgba(201,160,96,0.12)', color: '#C9A060', border: '1px solid rgba(201,160,96,0.3)' }}>
                        {entiteLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">{dateDisp}</td>
                    <td className="px-4 py-3">
                      <select
                        value={statut}
                        onChange={(e) => handleStatutChange(f.id as string, e.target.value)}
                        style={{ color: statutCfg.color, background: statutCfg.bg, border: `1px solid ${statutCfg.border}` }}
                        className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Envoyée</option>
                        <option value="paid">Payée</option>
                        <option value="retard">En retard</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/api/pdf/facture/${f.id as string}`} target="_blank" rel="noreferrer"
                          className="rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-[#C9A060]"
                          title="Télécharger PDF">
                          <span className="flex items-center gap-1"><Printer size={11} /> PDF</span>
                        </a>
                        {!!(client?.email) && (
                          <button onClick={() => openEmailModal(f)}
                            className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 transition hover:border-neutral-700 hover:text-sky-400"
                            title="Envoyer par email">
                            <Mail size={11} />
                          </button>
                        )}
                        <button onClick={() => openEdit(f)}
                          className="rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white">
                          Éditer
                        </button>
                        <button onClick={() => handleDelete(f.id as string)}
                          className="rounded-lg border border-neutral-800 p-1.5 text-neutral-500 transition hover:border-red-900/50 hover:text-red-400">
                          <Trash2 size={11} />
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

      {/* Modal envoi email facture */}
      {!!emailFacture && (
        <Modal open={!!emailFacture} onClose={() => setEmailFacture(null)}
          title="Envoyer la facture par email" size="sm">
          <div className="space-y-4 py-1">
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <p className="text-xs text-neutral-500 mb-1">Destinataire</p>
              <p className="text-sm font-medium text-white">{emailFacture.nom}</p>
              <p className="text-xs text-neutral-400">{emailFacture.email}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <p className="text-xs text-neutral-500 mb-1">Pièce jointe</p>
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-[#C9A060]" />
                <span className="text-xs text-neutral-300">Facture PDF (lien sécurisé)</span>
              </div>
            </div>
            <Textarea
              label="Message personnalisé (optionnel)"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Ajoutez un message..."
              rows={3}
            />
            {!!emailError && <p className="text-xs text-red-400">{emailError}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => setEmailFacture(null)} className="flex-1">Annuler</Button>
              <Button onClick={handleSendEmail} disabled={emailSending} className="flex-1">
                <Mail size={14} />
                {emailSending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
