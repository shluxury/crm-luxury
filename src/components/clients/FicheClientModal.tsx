'use client'

import { useEffect, useState } from 'react'
import { X, CalendarPlus, Mail, Pencil, TrendingUp, Calendar, CreditCard, BarChart2, Building2, User, Phone, Globe, Car, Droplets, Baby, StickyNote, Clock } from 'lucide-react'
import { getClientFiche } from '@/app/actions/clients'
import type { ClientFicheData } from '@/app/actions/clients'
import type { ClientWithStats } from '@/app/actions/clients'
import TagBadge from '@/components/ui/TagBadge'

// Couleurs par statut réservation
const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  devis:     { bg: 'rgba(201,168,76,0.15)',   color: '#C9A060', label: 'Devis' },
  confirmed: { bg: 'rgba(59,130,246,0.15)',   color: '#60a5fa', label: 'Confirmé' },
  paid:      { bg: 'rgba(34,197,94,0.15)',    color: '#4ade80', label: 'Payé' },
  part_paid: { bg: 'rgba(251,146,60,0.15)',   color: '#fb923c', label: 'Partiel' },
  completed: { bg: 'rgba(100,116,139,0.15)',  color: '#94a3b8', label: 'Terminé' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',    color: '#f87171', label: 'Annulé' },
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{size?: number; className?: string}>, label: string, value: string, color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-neutral-500" />
        <span className="text-[11px] text-neutral-500">{label}</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: color ?? 'var(--text)' }}>{value}</p>
    </div>
  )
}

interface FicheClientModalProps {
  client: ClientWithStats
  onClose: () => void
  onEdit: (client: ClientWithStats) => void
}

export default function FicheClientModal({ client, onClose, onEdit }: FicheClientModalProps) {
  const [fiche, setFiche] = useState<ClientFicheData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'infos' | 'historique'>('infos')

  useEffect(() => {
    setLoading(true)
    getClientFiche(client.id)
      .then(setFiche)
      .finally(() => setLoading(false))
  }, [client.id])

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const displayName = client.is_corporate && client.corp_nom
    ? client.corp_nom
    : `${client.prenom} ${client.nom}`

  const avatar = client.is_corporate && client.corp_nom
    ? client.corp_nom.charAt(0).toUpperCase()
    : (client.prenom.charAt(0) + client.nom.charAt(0)).toUpperCase()

  const contactEmail = fiche?.corp_contact_email || fiche?.email || client.corp_contact_email || client.email
  const contactTel   = fiche?.corp_contact_tel   || fiche?.tel   || client.corp_contact_tel   || client.tel

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function formatMontant(m: number, currency: string) {
    const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'AED' ? 'د.إ' : currency
    return `${sym}${Math.round(m).toLocaleString('fr-FR')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panneau latéral */}
      <div
        className="relative flex h-full w-full max-w-2xl flex-col shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-1)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}
        >
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={client.is_corporate
              ? { background: 'rgba(91,158,224,0.15)', border: '2px solid #5b9ee0', color: '#5b9ee0' }
              : { background: 'rgba(201,168,76,0.15)', border: '2px solid #C9A060', color: '#C9A060' }
            }
          >
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white truncate">{displayName}</h2>
              {client.is_corporate && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0" style={{ background: 'rgba(91,158,224,0.15)', color: '#5b9ee0', border: '1px solid rgba(91,158,224,0.3)' }}>
                  Corporate
                </span>
              )}
            </div>
            {client.is_corporate && client.corp_contact_nom && (
              <p className="text-xs text-neutral-400 mt-0.5">Contact : {client.corp_contact_nom}</p>
            )}
            {/* Tags */}
            {client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {client.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => window.location.href = `/reservations?client_id=${client.id}`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A060', border: '1px solid rgba(201,168,76,0.3)' }}
              title="Nouvelle réservation"
            >
              <CalendarPlus size={13} />
              <span className="hidden sm:inline">Résa</span>
            </button>
            {contactEmail && (
              <button
                onClick={() => window.open(`mailto:${contactEmail}`)}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-sky-400"
                title="Envoyer un email"
              >
                <Mail size={15} />
              </button>
            )}
            <button
              onClick={() => onEdit(client)}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              title="Modifier"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <StatCard icon={TrendingUp}  label="CA total"    value={fiche ? formatMontant(fiche.ca_total, 'EUR') : '—'} color="#4ade80" />
          <StatCard icon={BarChart2}   label="Missions"    value={loading ? '…' : String(fiche?.missions_count ?? client.missions_count)} />
          <StatCard icon={Calendar}    label="Dernière"    value={fiche?.derniere_reservation ? formatDate(fiche.derniere_reservation) : '—'} />
          <StatCard icon={CreditCard}  label="Panier moy." value={fiche && fiche.missions_count > 0 ? formatMontant(fiche.panier_moyen, 'EUR') : '—'} color="#C9A060" />
        </div>

        {/* Onglets */}
        <div className="flex gap-0 px-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {(['infos', 'historique'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-3 text-xs font-medium transition capitalize relative"
              style={{
                color: tab === t ? '#C9A060' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid #C9A060' : '2px solid transparent',
              }}
            >
              {t === 'infos' ? 'Informations' : `Historique (${fiche?.reservations.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-neutral-500 text-sm">Chargement...</div>
          ) : !fiche ? (
            <div className="flex items-center justify-center py-16 text-neutral-500 text-sm">Erreur de chargement</div>
          ) : tab === 'infos' ? (
            <div className="p-6 space-y-6">
              {/* Contact */}
              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  {contactTel && (
                    <InfoRow icon={Phone} label="Téléphone" value={contactTel} />
                  )}
                  {contactEmail && (
                    <InfoRow icon={Mail} label="Email" value={contactEmail} isEmail />
                  )}
                  {fiche.nationalite && (
                    <InfoRow icon={Globe} label="Nationalité" value={fiche.nationalite} />
                  )}
                  {fiche.langue && (
                    <InfoRow icon={Globe} label="Langue" value={fiche.langue.toUpperCase()} />
                  )}
                </div>
              </section>

              {/* Corporate */}
              {fiche.is_corporate && (
                <section>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Société</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {fiche.corp_nom && <InfoRow icon={Building2} label="Raison sociale" value={fiche.corp_nom} />}
                    {fiche.corp_siret && <InfoRow icon={Building2} label="SIRET" value={fiche.corp_siret} />}
                    {fiche.corp_tva && <InfoRow icon={Building2} label="TVA" value={fiche.corp_tva} />}
                    {(fiche.corp_adresse || fiche.corp_ville) && (
                      <InfoRow icon={Building2} label="Adresse" value={[fiche.corp_adresse, fiche.corp_cp, fiche.corp_ville, fiche.corp_pays].filter(Boolean).join(', ')} />
                    )}
                    {fiche.corp_contact_nom && <InfoRow icon={User} label="Contact" value={fiche.corp_contact_nom} />}
                    {fiche.corp_contact_tel && <InfoRow icon={Phone} label="Tél. contact" value={fiche.corp_contact_tel} />}
                    {fiche.corp_contact_email && <InfoRow icon={Mail} label="Email contact" value={fiche.corp_contact_email} isEmail />}
                  </div>
                </section>
              )}

              {/* Préférences */}
              {(fiche.pref_vehicule || fiche.pref_eau || fiche.pref_siege_enfant || fiche.pref_notes_chauffeur) && (
                <section>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Préférences</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {fiche.pref_vehicule && <InfoRow icon={Car} label="Véhicule préféré" value={fiche.pref_vehicule} />}
                    {fiche.pref_eau && <InfoRow icon={Droplets} label="Eau" value={fiche.pref_eau} />}
                    {fiche.pref_siege_enfant && <InfoRow icon={Baby} label="Siège enfant" value="Oui" />}
                    {fiche.pref_notes_chauffeur && <InfoRow icon={StickyNote} label="Notes chauffeur" value={fiche.pref_notes_chauffeur} wide />}
                  </div>
                </section>
              )}

              {/* Notes internes */}
              {fiche.notes && (
                <section>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Notes internes</h3>
                  <div className="rounded-xl p-4 text-sm text-neutral-300 whitespace-pre-wrap" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
                    {fiche.notes}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* Historique */
            <div className="p-6">
              {fiche.reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <Clock size={32} className="mb-3 opacity-50" />
                  <p className="text-sm">Aucune réservation pour ce client</p>
                  <button
                    onClick={() => window.location.href = `/reservations?client_id=${client.id}`}
                    className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition"
                    style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A060', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    <CalendarPlus size={13} />
                    Créer une réservation
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {fiche.reservations.map((r) => {
                    const st = STATUT_COLORS[r.statut] ?? STATUT_COLORS.devis
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-4 rounded-xl px-4 py-3 transition cursor-pointer"
                        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                        onClick={() => window.location.href = `/reservations`}
                      >
                        <div className="flex-shrink-0 text-center min-w-[52px]">
                          <p className="text-[11px] text-neutral-500">{new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                          <p className="text-[10px] text-neutral-600">{new Date(r.date).getFullYear()}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{r.service}</p>
                          {(r.depart || r.destination) && (
                            <p className="text-xs text-neutral-500 truncate">
                              {r.depart}{r.depart && r.destination ? ' → ' : ''}{r.destination}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {formatMontant(r.montant_percu || r.montant, r.currency)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant ligne d'info réutilisable
function InfoRow({
  icon: Icon,
  label,
  value,
  isEmail = false,
  wide = false,
}: {
  icon: React.ComponentType<{size?: number; className?: string}>
  label: string
  value: string
  isEmail?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
        <Icon size={12} className="text-neutral-500 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-neutral-500 mb-0.5">{label}</p>
          {isEmail ? (
            <a href={`mailto:${value}`} className="text-xs text-sky-400 hover:underline truncate block">{value}</a>
          ) : (
            <p className="text-xs text-white break-words">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}
