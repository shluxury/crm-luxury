'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReservationSchema = z.object({
  service: z.enum(['transfert_aeroport', 'transfert_simple', 'mise_a_disposition', 'helicoptere', 'jet_prive', 'restaurant', 'location_voiture']),
  entite: z.string().default('entite_1'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().min(1, 'Heure requise'),
  client_id: z.string().uuid('Client requis'),
  chauffeur_id: z.string().uuid().optional().nullable(),
  partenaire_id: z.string().uuid().optional().nullable(),
  dossier_id: z.string().uuid().optional().nullable(),
  depart: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  stops: z.array(z.string()).default([]),
  pax: z.number().min(1).default(1),
  bagages: z.number().min(0).default(0),
  vehicule: z.string().optional().default(''),
  num_vol: z.string().optional().default(''),
  montant: z.number().min(0).default(0),
  cout: z.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  repercuter_frais: z.boolean().default(false),
  taux_frais_client: z.number().default(2.95),
  montant_percu: z.number().min(0).default(0),
  statut: z.enum(['devis', 'confirmed', 'paid', 'part_paid', 'completed', 'cancelled']).default('devis'),
  fact_statut: z.string().default('non_facture'),
  cancel_reason: z.string().optional().default(''),
  ref_partenaire: z.string().optional().default(''),
  nb_heures: z.number().optional().nullable(),
  mad_itinerary: z.string().optional().default(''),
  wait_hours: z.number().optional().nullable(),
  wait_rate: z.number().optional().nullable(),
  notes: z.string().optional().default(''),
  resto: z.string().optional().default(''),
  couverts: z.number().optional().nullable(),
  occasion: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
  demandes_resto: z.string().optional().default(''),
  extras: z.array(z.object({
    desc: z.string(),
    qty: z.number().min(0),
    price: z.number().min(0),
    type: z.enum(['panier', 'libre']),
  })).default([]),
  pricing_mode: z.enum(['marge', 'commission']).default('marge'),
  montant_vol: z.number().optional().nullable(),
  comm_taux: z.number().optional().nullable(),
})

type ReservationInput = z.infer<typeof ReservationSchema>

export async function getReservations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, client:clients(id, prenom, nom), chauffeur:chauffeurs(id, nom), partenaire:partenaires(id, nom), dossier:dossiers(id, nom)')
    .order('date', { ascending: false })
    .order('heure', { ascending: false })
  if (error) throw error
  return data
}

export async function createReservationAction(input: ReservationInput) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = ReservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('reservations').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function updateReservationAction(id: string, input: ReservationInput) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = ReservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('reservations').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

const STATUT_RESERVATION = ['devis', 'confirmed', 'paid', 'part_paid', 'completed', 'cancelled'] as const
const FACT_STATUT_VALUES = ['non_facture', 'facture', 'encaisse'] as const

export async function updateStatutAction(id: string, statut: string, cancel_reason?: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  if (!(STATUT_RESERVATION as readonly string[]).includes(statut)) return { error: 'Statut invalide' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reservations')
    .update(cancel_reason !== undefined ? { statut, cancel_reason } : { statut })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function updateFactStatutAction(id: string, fact_statut: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  if (!(FACT_STATUT_VALUES as readonly string[]).includes(fact_statut)) return { error: 'Statut invalide' }

  const supabase = await createClient()
  const { error } = await supabase.from('reservations').update({ fact_statut }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function duplicateReservationAction(id: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const supabase = await createClient()
  const { data, error } = await supabase.from('reservations').select('*').eq('id', id).single()
  if (error) return { error: error.message }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _ca, ...rest } = data
  const { error: insertError } = await supabase.from('reservations').insert({
    ...rest,
    statut: 'devis',
    fact_statut: 'non_facture',
    montant_percu: 0,
    cancel_reason: null,
  })
  if (insertError) return { error: insertError.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function deleteReservationAction(id: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const supabase = await createClient()
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function addNoteReservationAction(id: string, note: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  if (!note.trim()) return { error: 'Note vide' }

  const supabase = await createClient()

  const now = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const entry = `[${now}] ${note.trim()}`

  // Mise à jour atomique via RPC PostgreSQL — évite la race condition READ-then-WRITE
  const { data, error } = await supabase.rpc('prepend_reservation_note', {
    p_id: id,
    p_note: entry,
  })
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true, notes: data as string }
}
