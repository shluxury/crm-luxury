'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, AlertTriangle, CalendarDays } from 'lucide-react'
import { getDashboardStats, type DashboardStats } from '@/app/actions/dashboard'

const MONTH_NAMES = [
  'Janvier', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
]

const MONTH_NAMES_FULL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function fmtMoney(n: number, hidden: boolean, currency = 'EUR') {
  if (hidden) return '•••••'
  const sym = currency === 'USD' ? '$' : currency === 'AED' ? 'AED ' : currency === 'GBP' ? '£' : '€'
  const suffix = currency !== 'EUR' ? '' : ''
  if (currency === 'EUR' || currency === 'GBP') {
    return `${sym}${Math.round(n).toLocaleString('fr-FR')}${suffix}`
  }
  return `${sym}${Math.round(n).toLocaleString('fr-FR')}`
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  borderColor?: string
  valueColor?: string
  onClick?: () => void
}

function StatCard({ label, value, sub, borderColor, valueColor, onClick }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border bg-neutral-900 p-4 ${borderColor ?? 'border-neutral-800'} ${onClick ? 'cursor-pointer hover:bg-neutral-800/50 transition' : ''}`}
      onClick={onClick}
    >
      <div className="text-xs text-neutral-400 mb-2">{label}</div>
      <div className={`text-2xl font-semibold ${valueColor ?? 'text-white'}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  )
}

// Badge de statut pour missions
function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Att. paiement', cls: 'bg-amber-900/40 text-amber-400' },
    paid: { label: 'Payé', cls: 'bg-green-900/40 text-green-400' },
    partial: { label: 'Partiel', cls: 'bg-blue-900/40 text-blue-400' },
    pending: { label: 'En attente', cls: 'bg-red-900/40 text-red-400' },
    devis: { label: 'Devis', cls: 'bg-neutral-800 text-neutral-400' },
    completed: { label: 'Terminé', cls: 'bg-green-900/40 text-green-400' },
  }
  const cfg = map[statut] ?? { label: statut, cls: 'bg-neutral-800 text-neutral-400' }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

interface DashboardClientProps {
  initialStats: DashboardStats
  initialYear: number
  initialMonth: number
}

export default function DashboardClient({ initialStats, initialYear, initialMonth }: DashboardClientProps) {
  const [stats, setStats] = useState(initialStats)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [hidden, setHidden] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [expandedPart, setExpandedPart] = useState<string | null>(null)
  const [expandedCaGroup, setExpandedCaGroup] = useState<string | null>(null)

  function navigate(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
    startTransition(async () => {
      const s = await getDashboardStats(newYear, newMonth)
      setStats(s)
    })
  }

  // CA mensuel chart
  const caMax = Math.max(...stats.ca_mensuel.map((v) => Math.max(v.n, v.n1)), 1)

  // CA par service groups
  const chauffeurKeys = ['aéroport', 'aeroport', 'transfert', 'disposition', 'mise à']
  const conciergeKeys = ['hélic', 'helic', 'jet', 'charter', 'restaurant', 'location', 'voiture']
  const isChauffeur = (s: string) => chauffeurKeys.some((k) => s.toLowerCase().includes(k))
  const isConcierge = (s: string) => conciergeKeys.some((k) => s.toLowerCase().includes(k))

  const grandTotal = stats.ca_par_service.reduce((s, x) => s + x.total, 0) || 1
  const caChauf = stats.ca_par_service.filter((x) => isChauffeur(x.service)).reduce((s, x) => s + x.total, 0)
  const caConc = stats.ca_par_service.filter((x) => isConcierge(x.service)).reduce((s, x) => s + x.total, 0)
  const caOther = grandTotal - 1 > 0 ? grandTotal - caChauf - caConc : 0

  return (
    <div className="space-y-4">

      {/* Navigation mois */}
      <div className="flex items-center justify-center gap-3 relative">
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-neutral-700 px-3 py-1 text-base text-white hover:border-[#C9A060] transition"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-white min-w-[130px] text-center">
          {MONTH_NAMES_FULL[month - 1]} {year}
        </span>
        <button
          onClick={() => navigate(1)}
          className="rounded-md border border-neutral-700 px-3 py-1 text-base text-white hover:border-[#C9A060] transition"
        >
          ›
        </button>
        {isPending && (
          <div className="absolute right-0 top-0 h-4 w-4 animate-spin rounded-full border border-neutral-600 border-t-[#C9A060]" />
        )}
      </div>

      {/* Bouton masquer */}
      <div className="flex justify-end">
        <button
          onClick={() => setHidden((h) => !h)}
          className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-[#C9A060] hover:text-[#C9A060] transition"
        >
          {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
          <span>{hidden ? 'Afficher' : 'Masquer'}</span>
        </button>
      </div>

      {/* Grille 6 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label={`CA ${MONTH_NAMES[month - 1]} ${year}`}
          value={fmtMoney(stats.ca, hidden)}
          sub={`${stats.missions_mois} résa${stats.missions_mois > 1 ? 's' : ''}`}
        />
        <StatCard
          label="Missions ce mois"
          value={hidden ? '••' : String(stats.missions_mois)}
          sub={`${MONTH_NAMES[month - 1]} ${year}`}
        />
        <StatCard
          label="En attente (clients)"
          value={fmtMoney(stats.en_attente_montant, hidden)}
          sub={`${stats.en_attente_count} résa(s) non encaissée(s)`}
          valueColor="text-white"
        />
        <StatCard
          label="Dû aux partenaires"
          value={fmtMoney(stats.partenaires_a_payer, hidden)}
          sub={stats.partenaires_detail.length > 0 ? `${stats.partenaires_detail.length} partenaire(s)` : 'Rien dû'}
          borderColor="border-red-900/40"
          valueColor="text-red-400"
          onClick={() => {
            document.getElementById('section-partenaires-payer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
        <StatCard
          label="Marge nette estimée"
          value={fmtMoney(stats.marge, hidden)}
          sub={stats.ca > 0 ? `${Math.round(stats.marge / stats.ca * 100)}% du CA` : 'ce mois'}
          valueColor="text-green-400"
        />
        <StatCard
          label={`CA Année ${year}`}
          value={fmtMoney(stats.ca_annee, hidden)}
          sub={`${stats.missions_annee} résa${stats.missions_annee > 1 ? 's' : ''} ${year}`}
          borderColor="border-[#C9A060]/30"
          valueColor="text-[#C9A060]"
        />
      </div>

      {/* Partenaires à payer + À encaisser dossiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Partenaires à payer */}
        <div id="section-partenaires-payer" className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden" style={{ boxShadow: 'inset 3px 0 0 rgba(255,180,0,0.6)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Partenaires — à payer</span>
              {stats.partenaires_detail.length > 0 && (
                <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  {stats.partenaires_detail.length} partenaire{stats.partenaires_detail.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {stats.partenaires_a_payer > 0 && (
              <span className="text-sm font-semibold text-amber-400">
                {fmtMoney(stats.partenaires_a_payer, hidden)} à payer
              </span>
            )}
          </div>
          <div className="p-4">
            {stats.partenaires_detail.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-5">Aucun montant à payer ✓</p>
            ) : (
              <div className="space-y-3">
                {stats.partenaires_detail.map((p) => {
                  const isOpen = expandedPart === p.partenaire_nom
                  return (
                    <div key={p.partenaire_nom}>
                      <div
                        className="flex items-center justify-between py-1.5 border-b border-neutral-800/60 cursor-pointer"
                        onClick={() => setExpandedPart(isOpen ? null : p.partenaire_nom)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] text-neutral-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                          <span className="text-sm font-semibold text-white">{p.partenaire_nom}</span>
                          <span className="text-xs text-neutral-500">· {p.missions.length} mission{p.missions.length > 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400">€{Math.round(p.total).toLocaleString('fr-FR')}</span>
                      </div>
                      {isOpen && (
                        <div className="mt-1">
                          {p.missions.map((mission) => (
                            <div key={mission.id} className="flex items-center justify-between py-1.5 pl-4 border-b border-neutral-800/30">
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-white">{mission.client} <span className="text-neutral-500">· {mission.service}</span></div>
                                <div className="text-xs text-neutral-500">{mission.date}</div>
                              </div>
                              <span className="text-sm font-semibold text-amber-400 ml-3 flex-shrink-0">
                                {fmtMoney(mission.montant, hidden, mission.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* À encaisser — dossiers */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden" style={{ boxShadow: 'inset 3px 0 0 rgba(255,180,0,0.6)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">À encaisser — dossiers</span>
              {stats.dossiers_a_encaisser.length > 0 && (
                <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  {stats.dossiers_a_encaisser.length} dossier{stats.dossiers_a_encaisser.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {stats.dossiers_a_encaisser_total > 0 && (
              <span className="text-sm font-semibold text-amber-400">
                {fmtMoney(stats.dossiers_a_encaisser_total, hidden)} restants
              </span>
            )}
          </div>
          <div className="p-4">
            {stats.dossiers_a_encaisser.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-5">Tout est encaissé ✓</p>
            ) : (
              <div className="space-y-3">
                {stats.dossiers_a_encaisser.map((d) => {
                  const pct = d.total > 0 ? Math.round(d.percu / d.total * 100) : 0
                  return (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{d.nom || d.client || d.dos_id}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{d.dos_id} · {d.client}</div>
                        <div className="mt-1.5 h-1 rounded-full bg-neutral-800">
                          <div className="h-1 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-amber-400">{fmtMoney(d.restant, hidden)}</div>
                        <div className="text-xs text-neutral-500">{pct}% encaissé</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CA par service + CA mensuel N vs N-1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* CA par service */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">CA par service</h3>
          {stats.ca_par_service.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2.5">
              {/* Groupe Chauffeur */}
              {caChauf > 0 && (
                <div>
                  <div
                    className="flex items-center justify-between cursor-pointer py-1"
                    onClick={() => setExpandedCaGroup(expandedCaGroup === 'chauf' ? null : 'chauf')}
                  >
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      🚗 Chauffeur
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{hidden ? '•••' : `€${Math.round(caChauf).toLocaleString('fr-FR')} · ${Math.round(caChauf / grandTotal * 100)}%`}</span>
                      <span className={`text-[10px] text-neutral-400 transition-transform ${expandedCaGroup === 'chauf' ? 'rotate-90' : ''}`}>▶</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 mb-1.5">
                    <div className="h-1.5 rounded-full bg-[#C9A060]" style={{ width: `${Math.round(caChauf / grandTotal * 100)}%` }} />
                  </div>
                  {expandedCaGroup === 'chauf' && (
                    <div className="pl-4 space-y-2 mt-1">
                      {stats.ca_par_service.filter((x) => isChauffeur(x.service)).map((x) => (
                        <div key={x.service}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-neutral-400">{x.service}</span>
                            <span>{hidden ? '•••' : `€${Math.round(x.total).toLocaleString('fr-FR')} · ${Math.round(x.total / grandTotal * 100)}%`}</span>
                          </div>
                          <div className="h-1 rounded-full bg-neutral-800">
                            <div className="h-1 rounded-full bg-[#C9A060]/40" style={{ width: `${Math.round(x.total / grandTotal * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Groupe Conciergerie */}
              {caConc > 0 && (
                <div>
                  <div
                    className="flex items-center justify-between cursor-pointer py-1"
                    onClick={() => setExpandedCaGroup(expandedCaGroup === 'conc' ? null : 'conc')}
                  >
                    <span className="text-xs font-semibold text-white">✨ Conciergerie</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{hidden ? '•••' : `€${Math.round(caConc).toLocaleString('fr-FR')} · ${Math.round(caConc / grandTotal * 100)}%`}</span>
                      <span className={`text-[10px] text-neutral-400 transition-transform ${expandedCaGroup === 'conc' ? 'rotate-90' : ''}`}>▶</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 mb-1.5">
                    <div className="h-1.5 rounded-full bg-[#C9A060]" style={{ width: `${Math.round(caConc / grandTotal * 100)}%` }} />
                  </div>
                  {expandedCaGroup === 'conc' && (
                    <div className="pl-4 space-y-2 mt-1">
                      {stats.ca_par_service.filter((x) => isConcierge(x.service)).map((x) => (
                        <div key={x.service}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-neutral-400">{x.service}</span>
                            <span>{hidden ? '•••' : `€${Math.round(x.total).toLocaleString('fr-FR')} · ${Math.round(x.total / grandTotal * 100)}%`}</span>
                          </div>
                          <div className="h-1 rounded-full bg-neutral-800">
                            <div className="h-1 rounded-full bg-[#C9A060]/40" style={{ width: `${Math.round(x.total / grandTotal * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Autres */}
              {caOther > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-neutral-400">Autres</span>
                    <span>{hidden ? '•••' : `€${Math.round(caOther).toLocaleString('fr-FR')} · ${Math.round(caOther / grandTotal * 100)}%`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800">
                    <div className="h-1.5 rounded-full bg-[#C9A060]" style={{ width: `${Math.round(caOther / grandTotal * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CA mensuel N vs N-1 */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">CA mensuel — {year} vs {year - 1}</h3>
          {stats.ca_mensuel.every((v) => v.n === 0 && v.n1 === 0) ? (
            <p className="text-xs text-neutral-500 text-center py-4">Aucune donnée disponible</p>
          ) : (
            <>
              <div className="space-y-2">
                {stats.ca_mensuel.map((v) => {
                  const diff = v.n1 > 0 ? Math.round((v.n - v.n1) / v.n1 * 100) : null
                  return (
                    <div key={v.mois} className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 w-7">{v.mois}</span>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="h-1.5 rounded-full bg-neutral-800">
                          <div className="h-1.5 rounded-full bg-[#C9A060]" style={{ width: `${Math.round(v.n / caMax * 100)}%` }} />
                        </div>
                        {v.n1 > 0 && (
                          <div className="h-1 rounded-full bg-neutral-800">
                            <div className="h-1 rounded-full bg-neutral-600" style={{ width: `${Math.round(v.n1 / caMax * 100)}%` }} />
                          </div>
                        )}
                      </div>
                      {diff !== null ? (
                        <span className={`text-xs w-10 text-right ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{diff}%
                        </span>
                      ) : (
                        <span className="w-10" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-1 rounded-full bg-[#C9A060]" />
                  <span className="text-xs text-neutral-500">{year}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-1 rounded-full bg-neutral-600" />
                  <span className="text-xs text-neutral-500">{year - 1}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Missions à venir 7j */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-neutral-400" />
            <span className="text-sm font-semibold text-white">Missions à venir — 7 jours</span>
          </div>
          <a href="/planning" className="text-xs text-neutral-400 hover:text-[#C9A060] transition">Voir planning →</a>
        </div>
        <div className="divide-y divide-neutral-800">
          {stats.missions_a_venir.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-400 text-center">
              Aucune mission dans les 7 prochains jours
            </div>
          ) : (
            stats.missions_a_venir.map((m) => {
              const clientNom = m.client ? `${m.client.prenom} ${m.client.nom}`.trim() : '—'
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/30 transition">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.statut === 'paid' || m.statut === 'completed' ? 'bg-green-500' : 'bg-[#C9A060]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{m.service || '—'}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{m.date} · {m.heure?.slice(0, 5) ?? ''} · {clientNom}</div>
                  </div>
                  <StatusBadge statut={m.statut} />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* À facturer */}
      <div className="rounded-xl border border-red-900/30 bg-neutral-900 overflow-hidden" style={{ boxShadow: 'inset 3px 0 0 rgba(224,82,82,0.5)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">À facturer</span>
            {stats.a_facturer_list.length > 0 && (
              <span className="rounded-full bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-400">
                {stats.a_facturer_list.length} mission{stats.a_facturer_list.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {stats.a_facturer_total > 0 && (
              <span className="text-sm font-semibold text-red-400">
                {fmtMoney(stats.a_facturer_total, hidden)} à facturer
              </span>
            )}
            <a href="/reservations" className="text-xs text-neutral-400 hover:text-[#C9A060] transition">Voir tout →</a>
          </div>
        </div>
        <div className="divide-y divide-neutral-800">
          {stats.a_facturer_list.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-400 text-center">
              Aucune réservation à facturer ✓
            </div>
          ) : (
            stats.a_facturer_list.map((m) => {
              const clientNom = m.client ? `${m.client.prenom} ${m.client.nom}`.trim() : '—'
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/30 transition">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{m.service || '—'}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{m.date} · {m.heure?.slice(0, 5) ?? ''} · {clientNom}</div>
                  </div>
                  <span className="text-sm font-semibold text-red-400 flex-shrink-0">
                    {fmtMoney(m.montant, hidden, m.currency)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Alertes */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-sm font-semibold text-white">Alertes</span>
          </div>
          {stats.alertes.length > 0 && (
            <span className="text-xs text-neutral-500">
              {stats.alertes.length} alerte{stats.alertes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-4">
          {stats.alertes.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-2">✓ Aucune alerte</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stats.alertes.map((a, i) => {
                const styles: Record<string, { bg: string; border: string; text: string }> = {
                  danger: { bg: 'bg-red-950/30', border: 'border-red-900/30', text: 'text-red-400' },
                  warn:   { bg: 'bg-amber-950/30', border: 'border-amber-900/30', text: 'text-amber-400' },
                  info:   { bg: 'bg-blue-950/30', border: 'border-blue-900/30', text: 'text-blue-400' },
                }
                const s = styles[a.type]
                return (
                  <div key={i} className={`flex-1 min-w-48 rounded-lg border ${s.bg} ${s.border} px-3 py-2.5`}>
                    <div className={`text-xs font-medium ${s.text}`}>{a.titre}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{a.detail}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
