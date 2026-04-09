'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ClientSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  tel: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  nationalite: z.string().optional(),
  langue: z.enum(['fr', 'en']).default('fr'),
  entreprise: z.string().optional(),
  notes: z.string().optional(),
  is_corporate: z.boolean().default(false),
  corp_nom: z.string().optional(),
  corp_siret: z.string().optional(),
  corp_tva: z.string().optional(),
  corp_adresse: z.string().optional(),
  corp_cp: z.string().optional(),
  corp_ville: z.string().optional(),
  corp_pays: z.string().optional(),
  corp_contact_nom: z.string().optional(),
  corp_contact_tel: z.string().optional(),
  corp_contact_email: z.string().optional().or(z.literal('')),
  pref_vehicule: z.string().optional(),
  pref_eau: z.string().optional(),
  pref_siege_enfant: z.boolean().default(false),
  pref_notes_chauffeur: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

type ClientInput = z.infer<typeof ClientSchema>

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('nom', { ascending: true })
  if (error) throw error
  return data
}

export interface ClientWithStats {
  id: string
  prenom: string
  nom: string
  tel: string | null
  email: string | null
  nationalite: string | null
  langue: string
  tags: string[]
  entreprise: string | null
  is_corporate: boolean
  corp_nom: string | null
  corp_contact_nom: string | null
  corp_contact_tel: string | null
  corp_contact_email: string | null
  notes: string | null
  missions_count: number
  ca_total: number
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  const supabase = await createClient()

  const [clientsRes, resasRes] = await Promise.all([
    supabase.from('clients').select('*').order('nom'),
    supabase.from('reservations').select('client_id, montant, montant_percu, statut').neq('statut', 'cancelled'),
  ])
  if (clientsRes.error) throw clientsRes.error

  const resas = resasRes.data ?? []
  const statsByClient: Record<string, { missions: number; ca: number }> = {}
  for (const r of resas) {
    if (!r.client_id) continue
    if (!statsByClient[r.client_id]) statsByClient[r.client_id] = { missions: 0, ca: 0 }
    statsByClient[r.client_id].missions++
    statsByClient[r.client_id].ca += r.montant_percu ?? r.montant ?? 0
  }

  return (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    tel: c.tel,
    email: c.email,
    nationalite: c.nationalite,
    langue: c.langue,
    tags: c.tags ?? [],
    entreprise: c.entreprise,
    is_corporate: c.is_corporate,
    corp_nom: c.corp_nom,
    corp_contact_nom: c.corp_contact_nom,
    corp_contact_tel: c.corp_contact_tel,
    corp_contact_email: c.corp_contact_email,
    notes: c.notes,
    missions_count: statsByClient[c.id]?.missions ?? 0,
    ca_total: statsByClient[c.id]?.ca ?? 0,
  }))
}

export async function createClientAction(input: ClientInput) {
  const parsed = ClientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('clients').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function updateClientAction(id: string, input: ClientInput) {
  const parsed = ClientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export interface ClientReservation {
  id: string
  created_at: string
  service: string
  entite: string
  date: string
  heure: string
  depart: string | null
  destination: string | null
  vehicule: string | null
  montant: number
  montant_percu: number
  currency: string
  statut: string
  fact_statut: string
  chauffeur_id: string | null
  notes: string | null
}

export async function getClientReservations(clientId: string): Promise<ClientReservation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('id, created_at, service, entite, date, heure, depart, destination, vehicule, montant, montant_percu, currency, statut, fact_statut, chauffeur_id, notes')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as ClientReservation[]
}

export interface ClientFicheData extends ClientWithStats {
  corp_adresse: string | null
  corp_cp: string | null
  corp_ville: string | null
  corp_pays: string | null
  corp_siret: string | null
  corp_tva: string | null
  pref_vehicule: string | null
  pref_eau: string | null
  pref_siege_enfant: boolean
  pref_notes_chauffeur: string | null
  reservations: ClientReservation[]
  derniere_reservation: string | null
  panier_moyen: number
}

export async function getClientFiche(clientId: string): Promise<ClientFicheData | null> {
  const supabase = await createClient()

  const [clientRes, resasRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase
      .from('reservations')
      .select('id, created_at, service, entite, date, heure, depart, destination, vehicule, montant, montant_percu, currency, statut, fact_statut, chauffeur_id, notes')
      .eq('client_id', clientId)
      .order('date', { ascending: false }),
  ])

  if (clientRes.error || !clientRes.data) return null

  const c = clientRes.data
  const reservations = (resasRes.data ?? []) as ClientReservation[]
  const nonCancelled = reservations.filter((r) => r.statut !== 'cancelled')
  const ca_total = nonCancelled.reduce((s, r) => s + (r.montant_percu ?? r.montant ?? 0), 0)
  const panier_moyen = nonCancelled.length > 0 ? ca_total / nonCancelled.length : 0
  const derniere = nonCancelled.length > 0 ? nonCancelled[0].date : null

  return {
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    tel: c.tel,
    email: c.email,
    nationalite: c.nationalite,
    langue: c.langue,
    tags: c.tags ?? [],
    entreprise: c.entreprise,
    notes: c.notes,
    is_corporate: c.is_corporate,
    corp_nom: c.corp_nom,
    corp_adresse: c.corp_adresse,
    corp_cp: c.corp_cp,
    corp_ville: c.corp_ville,
    corp_pays: c.corp_pays,
    corp_siret: c.corp_siret,
    corp_tva: c.corp_tva,
    corp_contact_nom: c.corp_contact_nom,
    corp_contact_tel: c.corp_contact_tel,
    corp_contact_email: c.corp_contact_email,
    pref_vehicule: c.pref_vehicule,
    pref_eau: c.pref_eau,
    pref_siege_enfant: c.pref_siege_enfant,
    pref_notes_chauffeur: c.pref_notes_chauffeur,
    missions_count: nonCancelled.length,
    ca_total,
    panier_moyen,
    derniere_reservation: derniere,
    reservations,
  }
}
