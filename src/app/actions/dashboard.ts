'use server'

import { createClient } from '@/lib/supabase/server'

export interface MissionResume {
  id: string
  date: string
  heure: string | null
  service: string
  entite: string
  montant: number
  currency: string
  statut: string
  fact_statut: string
  client: { prenom: string; nom: string } | null
  chauffeur: { nom: string } | null
}

export interface PartenaireAPayerItem {
  partenaire_nom: string
  missions: {
    id: string
    date: string
    service: string
    client: string
    montant: number
    currency: string
  }[]
  total: number
}

export interface DossierAEncaisserItem {
  id: string
  dos_id: string
  nom: string
  client: string
  total: number
  percu: number
  restant: number
}

export interface DashboardStats {
  ca: number
  ca_annee: number
  marge: number
  missions_mois: number
  missions_annee: number
  en_attente_count: number
  en_attente_montant: number
  partenaires_a_payer: number
  partenaires_detail: PartenaireAPayerItem[]
  total_clients: number
  chauffeurs_dispos: number
  missions_a_venir: MissionResume[]
  a_facturer_list: MissionResume[]
  a_facturer_total: number
  dossiers_a_encaisser: DossierAEncaisserItem[]
  dossiers_a_encaisser_total: number
  ca_par_service: { service: string; total: number }[]
  ca_mensuel: { mois: string; n: number; n1: number }[]
  alertes: { type: 'danger' | 'warn' | 'info'; titre: string; detail: string }[]
}

export async function getDashboardStats(year?: number, month?: number): Promise<DashboardStats> {
  const supabase = await createClient()
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? (now.getMonth() + 1)
  const debut = `${y}-${String(m).padStart(2, '0')}-01`
  const finDate = new Date(y, m, 0)
  const fin = `${y}-${String(m).padStart(2, '0')}-${String(finDate.getDate()).padStart(2, '0')}`
  const debutAnnee = `${y}-01-01`
  const finAnnee = `${y}-12-31`

  const [
    resasMois,
    resasAnnee,
    allClients,
    allChauffeurs,
    resasAVenir,
    resasAFacturer,
    tousResas,
    dossiers,
  ] = await Promise.all([
    // Stats du mois
    supabase
      .from('reservations')
      .select('id, montant, cout, currency, statut, fact_statut, montant_percu, service, partenaire_id, entite')
      .gte('date', debut)
      .lte('date', fin)
      .neq('statut', 'cancelled'),

    // Stats de l'année
    supabase
      .from('reservations')
      .select('id, montant, statut')
      .gte('date', debutAnnee)
      .lte('date', finAnnee)
      .neq('statut', 'cancelled')
      .neq('statut', 'devis'),

    supabase.from('clients').select('id', { count: 'exact', head: true }),

    supabase.from('chauffeurs').select('statut'),

    // Missions à venir 7j
    supabase
      .from('reservations')
      .select('id, date, heure, service, entite, montant, currency, statut, fact_statut, client:clients(prenom, nom), chauffeur:chauffeurs(nom)')
      .gte('date', new Date().toISOString().slice(0, 10))
      .lte('date', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
      .neq('statut', 'cancelled')
      .order('date')
      .order('heure')
      .limit(20),

    // À facturer
    supabase
      .from('reservations')
      .select('id, date, heure, service, entite, montant, currency, statut, fact_statut, client:clients(prenom, nom), chauffeur:chauffeurs(nom)')
      .eq('fact_statut', 'a_facturer')
      .neq('statut', 'cancelled')
      .order('date', { ascending: false })
      .limit(20),

    // Toutes les réservations actives pour partenaires dûs + alertes
    supabase
      .from('reservations')
      .select('id, date, heure, service, entite, montant, cout, currency, statut, fact_statut, chauffeur_id, partenaire_id, montant_percu, client:clients(prenom, nom), chauffeur:chauffeurs(nom), partenaire:partenaires(nom)')
      .neq('statut', 'cancelled')
      .order('date', { ascending: false }),

    // Dossiers pour "à encaisser"
    supabase
      .from('dossiers')
      .select('id, nom, statut, montant_percu, client:clients(prenom, nom)')
      .neq('statut', 'archive'),
  ])

  const resas = resasMois.data ?? []

  // Stats mois
  const ca = resas
    .filter((r) => r.statut !== 'devis')
    .reduce((s, r) => s + (r.montant ?? 0), 0)
  const marge = resas
    .filter((r) => r.statut !== 'devis')
    .reduce((s, r) => s + ((r.montant ?? 0) - (r.cout ?? 0)), 0)
  const missions_mois = resas.filter((r) => r.statut !== 'devis').length

  // Stats année
  const ca_annee = (resasAnnee.data ?? []).reduce((s, r) => s + (r.montant ?? 0), 0)
  const missions_annee = resasAnnee.data?.length ?? 0

  // En attente (clients non encaissés)
  const enAttenteResas = resas.filter((r) => ['pending', 'confirmed', 'partial'].includes(r.statut))
  const en_attente_count = enAttenteResas.length
  const en_attente_montant = enAttenteResas.reduce((s, r) => s + (r.montant ?? 0), 0)

  // Partenaires à payer (réservations actives avec partenaire, non payées)
  const allResasData = (tousResas.data ?? []) as Record<string, unknown>[]
  const partenairesMap: Record<string, PartenaireAPayerItem> = {}

  for (const r of allResasData) {
    const cout = (r.cout as number) ?? 0
    if (cout <= 0) continue
    // On ne considère que les réservations non annulées
    if (r.statut === 'cancelled') continue

    // Obtenir le nom du partenaire
    let partNom = ''
    if (r.partenaire) {
      const p = r.partenaire as { nom?: string }
      partNom = p.nom ?? ''
    }
    if (!partNom) continue

    if (!partenairesMap[partNom]) {
      partenairesMap[partNom] = { partenaire_nom: partNom, missions: [], total: 0 }
    }

    const client = r.client as { prenom?: string; nom?: string } | null
    partenairesMap[partNom].missions.push({
      id: r.id as string,
      date: r.date as string,
      service: r.service as string,
      client: client ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() : '—',
      montant: cout,
      currency: (r.currency as string) ?? 'EUR',
    })
    partenairesMap[partNom].total += cout
  }

  const partenaires_detail = Object.values(partenairesMap).sort((a, b) => b.total - a.total)
  const partenaires_a_payer = partenaires_detail.reduce((s, p) => s + p.total, 0)

  // CA par service (mois courant)
  const caParService: Record<string, number> = {}
  for (const r of resas.filter((r) => r.statut !== 'devis')) {
    caParService[r.service] = (caParService[r.service] ?? 0) + (r.montant ?? 0)
  }
  const ca_par_service = Object.entries(caParService)
    .map(([service, total]) => ({ service, total }))
    .sort((a, b) => b.total - a.total)

  // CA mensuel N vs N-1 (6 derniers mois)
  const allResasForChart = allResasData.filter((r) => r.statut !== 'cancelled' && r.statut !== 'devis')
  const MOIS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const ca_mensuel = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    const dm = d.getMonth()
    const dy = d.getFullYear()
    const dm1 = dm
    const dy1 = dy - 1
    const caN = allResasForChart
      .filter((r) => {
        const rd = r.date as string
        if (!rd) return false
        const rDate = new Date(rd)
        return rDate.getMonth() === dm && rDate.getFullYear() === dy
      })
      .reduce((s, r) => s + ((r.montant as number) ?? 0), 0)
    const caN1 = allResasForChart
      .filter((r) => {
        const rd = r.date as string
        if (!rd) return false
        const rDate = new Date(rd)
        return rDate.getMonth() === dm1 && rDate.getFullYear() === dy1
      })
      .reduce((s, r) => s + ((r.montant as number) ?? 0), 0)
    ca_mensuel.push({ mois: MOIS_SHORT[dm], n: caN, n1: caN1 })
  }

  // À facturer total
  const aFacturerData = (resasAFacturer.data ?? []) as Record<string, unknown>[]
  const a_facturer_total = aFacturerData.reduce((s, r) => s + ((r.montant as number) ?? 0), 0)

  // Dossiers à encaisser — calcul depuis les réservations liées
  const dossiersData = (dossiers.data ?? []) as Record<string, unknown>[]
  const dossiers_a_encaisser: DossierAEncaisserItem[] = []

  for (const d of dossiersData) {
    const dosId = d.id as string
    // Calculer le total des réservations liées à ce dossier
    const dosResas = allResasData.filter(
      (r) => r.dossier_id === dosId && r.statut !== 'cancelled' && r.statut !== 'devis'
    )
    const total = dosResas.reduce((s, r) => s + ((r.montant as number) ?? 0), 0)
    if (total <= 0) continue

    const percu = (d.montant_percu as number) ?? 0
    const restant = Math.max(0, total - percu)
    if (restant < 0.01) continue

    const clientData = d.client as { prenom?: string; nom?: string } | null
    const clientNom = clientData ? `${clientData.prenom ?? ''} ${clientData.nom ?? ''}`.trim() : ''

    dossiers_a_encaisser.push({
      id: dosId,
      dos_id: dosId.slice(0, 8).toUpperCase(),
      nom: (d.nom as string) ?? '',
      client: clientNom,
      total,
      percu,
      restant,
    })
  }
  dossiers_a_encaisser.sort((a, b) => b.restant - a.restant)
  const dossiers_a_encaisser_total = dossiers_a_encaisser.reduce((s, d) => s + d.restant, 0)

  // Alertes dynamiques
  const alertes: DashboardStats['alertes'] = []
  const todayStr = new Date().toISOString().slice(0, 10)
  const in7Str = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  // Réservations confirmées sans chauffeur dans les 7j
  allResasData
    .filter((r) => {
      const d = r.date as string
      return d >= todayStr && d <= in7Str && !r.chauffeur_id && r.statut === 'confirmed'
    })
    .slice(0, 5)
    .forEach((r) => {
      const client = r.client as { prenom?: string; nom?: string } | null
      const clientNom = client ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() : '—'
      alertes.push({
        type: 'warn',
        titre: 'Chauffeur à assigner',
        detail: `${clientNom} · ${r.date} · ${r.service}`,
      })
    })

  // Paiements non encaissés (date passée)
  allResasData
    .filter((r) => {
      const d = r.date as string
      return d < todayStr && ['pending', 'confirmed'].includes(r.statut as string) && (r.montant as number) > 0
    })
    .slice(0, 3)
    .forEach((r) => {
      const client = r.client as { prenom?: string; nom?: string } | null
      const clientNom = client ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() : '—'
      alertes.push({
        type: 'danger',
        titre: 'Paiement non encaissé',
        detail: `${clientNom} · €${Math.round((r.montant as number) ?? 0).toLocaleString('fr-FR')} · ${r.date}`,
      })
    })

  // Partenaires dûs
  partenaires_detail.slice(0, 3).forEach((p) => {
    alertes.push({
      type: 'danger',
      titre: 'Paiement partenaire dû',
      detail: `${p.partenaire_nom} · €${Math.round(p.total).toLocaleString('fr-FR')}`,
    })
  })

  // Devis en attente
  allResasData
    .filter((r) => r.statut === 'devis')
    .slice(0, 3)
    .forEach((r) => {
      const client = r.client as { prenom?: string; nom?: string } | null
      const clientNom = client ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() : '—'
      alertes.push({
        type: 'info',
        titre: 'Devis en attente',
        detail: `${clientNom} · ${r.service} · ${r.date}`,
      })
    })

  const toMission = (r: Record<string, unknown>): MissionResume => ({
    id: r.id as string,
    date: r.date as string,
    heure: r.heure as string | null,
    service: r.service as string,
    entite: r.entite as string,
    montant: (r.montant as number) ?? 0,
    currency: (r.currency as string) ?? 'EUR',
    statut: r.statut as string,
    fact_statut: r.fact_statut as string,
    client: r.client as { prenom: string; nom: string } | null,
    chauffeur: r.chauffeur as { nom: string } | null,
  })

  return {
    ca,
    ca_annee,
    marge,
    missions_mois,
    missions_annee,
    en_attente_count,
    en_attente_montant,
    partenaires_a_payer,
    partenaires_detail,
    total_clients: allClients.count ?? 0,
    chauffeurs_dispos: (allChauffeurs.data ?? []).filter((c) => c.statut === 'dispo').length,
    missions_a_venir: (resasAVenir.data ?? []).map((r) => toMission(r as Record<string, unknown>)),
    a_facturer_list: aFacturerData.map(toMission),
    a_facturer_total,
    dossiers_a_encaisser,
    dossiers_a_encaisser_total,
    ca_par_service,
    ca_mensuel,
    alertes,
  }
}
