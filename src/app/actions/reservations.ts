'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReservationSchema = z.object({
  service: z.enum(['transfert_aeroport', 'transfert_simple', 'mise_a_disposition', 'helicoptere', 'jet_prive', 'restaurant', 'location_voiture']),
  entite: z.enum(['leader_limousines', 'leader_concierge_dubai']).default('leader_limousines'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().min(1, 'Heure requise'),
  client_id: z.string().uuid('Client requis'),
  chauffeur_id: z.string().uuid().optional().nullable(),
  partenaire_id: z.string().uuid().optional().nullable(),
  depart: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  pax: z.number().min(1).default(1),
  bagages: z.number().min(0).default(0),
  vehicule: z.string().optional().default(''),
  num_vol: z.string().optional().default(''),
  montant: z.number().min(0).default(0),
  cout: z.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  montant_percu: z.number().min(0).default(0),
  statut: z.enum(['devis', 'confirmed', 'paid', 'part_paid', 'completed', 'cancelled']).default('devis'),
  notes: z.string().optional().default(''),
  // Restaurant
  resto: z.string().optional().default(''),
  couverts: z.number().optional().nullable(),
  occasion: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
})

type ReservationInput = z.infer<typeof ReservationSchema>

export async function getReservations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*, client:clients(id, prenom, nom), chauffeur:chauffeurs(id, nom), partenaire:partenaires(id, nom)')
    .order('date', { ascending: false })
    .order('heure', { ascending: false })
  if (error) throw error
  return data
}

export async function createReservationAction(input: ReservationInput) {
  const parsed = ReservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('reservations').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function updateReservationAction(id: string, input: ReservationInput) {
  const parsed = ReservationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('reservations').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function updateStatutAction(id: string, statut: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('reservations').update({ statut }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}

export async function deleteReservationAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservations')
  return { success: true }
}
