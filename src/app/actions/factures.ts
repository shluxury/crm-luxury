'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSettings } from './settings'

const FactureSchema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  client_id: z.string().uuid().optional().nullable(),
  entite: z.string().default('entite_1'),
  montant: z.coerce.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  statut: z.enum(['draft', 'sent', 'paid', 'retard']).default('draft'),
  notes: z.string().optional().default(''),
  reservation_id: z.string().uuid().optional().nullable(),
  dossier_id: z.string().uuid().optional().nullable(),
})

type FactureInput = z.infer<typeof FactureSchema>

export async function getFactures() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('factures')
    .select('*, client:clients(id, prenom, nom, email), reservation:reservations(id, service, date, depart, destination)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateFactureStatutAction(id: string, statut: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('factures').update({ statut }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/facturation')
  return { success: true }
}

// Génère le prochain numéro de facture basé sur le nom de l'entité configurée
export async function getNextNumero(entiteId: string): Promise<string> {
  const supabase = await createClient()
  const settings = await getSettings()
  const entite = settings.entites.find((e) => e.id === entiteId)
  // Préfixe = 2 premières lettres du nom en majuscule, ou l'ID si nom vide
  const nom = entite?.nom?.trim() || entiteId
  const prefix = nom.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase() || 'FAC'
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('factures')
    .select('*', { count: 'exact', head: true })
    .eq('entite', entiteId)
    .like('numero', `${prefix}-${year}-%`)
  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

export async function createFactureAction(input: FactureInput) {
  const parsed = FactureSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('factures').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/facturation')
  return { success: true }
}

export async function updateFactureAction(id: string, input: FactureInput) {
  const parsed = FactureSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('factures').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/facturation')
  return { success: true }
}

// Crée une facture pré-remplie depuis une réservation
export async function createFactureFromReservationAction(reservationId: string) {
  const supabase = await createClient()
  const { data: resaRaw, error } = await supabase
    .from('reservations')
    .select('client_id, entite, montant, currency, mode_paiement, montant_percu')
    .eq('id', reservationId)
    .single()
  if (error || !resaRaw) return { error: 'Réservation introuvable' }
  const resa = resaRaw as Record<string, unknown>

  const entiteId = (resa.entite as string) ?? 'entite_1'
  const numero = await getNextNumero(entiteId)

  const input: FactureInput = {
    numero,
    client_id: (resa.client_id as string) ?? null,
    entite: entiteId,
    montant: (resa.montant as number) ?? 0,
    currency: (resa.currency as 'EUR' | 'USD' | 'AED' | 'GBP') ?? 'EUR',
    mode_paiement: (resa.mode_paiement as FactureInput['mode_paiement']) ?? null,
    statut: 'draft',
    notes: '',
    reservation_id: reservationId,
  }
  const parsed = FactureSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: created, error: insertError } = await supabase
    .from('factures')
    .insert(parsed.data)
    .select('id')
    .single()
  if (insertError) return { error: insertError.message }

  // Met à jour le statut de facturation de la réservation
  await supabase.from('reservations').update({ fact_statut: 'facture' }).eq('id', reservationId)

  revalidatePath('/facturation')
  revalidatePath('/reservations')
  return { success: true, id: (created as Record<string, string>).id }
}

// Crée une facture groupée depuis les réservations d'un dossier
export async function createFactureFromDossierAction(
  dossierId: string,
  reservationIds: string[],
) {
  if (!reservationIds.length) return { error: 'Aucune réservation sélectionnée' }

  const supabase = await createClient()

  // Récupérer le dossier avec son client et les réservations sélectionnées
  const { data: dossierRaw, error: dossierErr } = await supabase
    .from('dossiers')
    .select('client_id, entite, nom')
    .eq('id', dossierId)
    .single()
  if (dossierErr || !dossierRaw) return { error: 'Dossier introuvable' }
  const dossier = dossierRaw as Record<string, unknown>

  // Récupérer les réservations sélectionnées
  const { data: resasRaw, error: resasErr } = await supabase
    .from('reservations')
    .select('id, montant, currency, mode_paiement, entite')
    .in('id', reservationIds)
  if (resasErr || !resasRaw) return { error: 'Réservations introuvables' }
  const resas = resasRaw as Record<string, unknown>[]

  // Calculer le montant total
  const total = resas.reduce((sum, r) => sum + ((r.montant as number) ?? 0), 0)
  const entiteId = (dossier.entite as string) ?? (resas[0]?.entite as string) ?? 'entite_1'
  const currency = (resas[0]?.currency as FactureInput['currency']) ?? 'EUR'
  const numero = await getNextNumero(entiteId)

  const input: FactureInput = {
    numero,
    client_id: (dossier.client_id as string) ?? null,
    entite: entiteId,
    montant: Math.round(total * 100) / 100,
    currency,
    mode_paiement: (resas[0]?.mode_paiement as FactureInput['mode_paiement']) ?? null,
    statut: 'draft',
    notes: `Facture groupée — Dossier : ${dossier.nom as string ?? dossierId}`,
    dossier_id: dossierId,
  }
  const parsed = FactureSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: created, error: insertError } = await supabase
    .from('factures')
    .insert(parsed.data)
    .select('id')
    .single()
  if (insertError) return { error: insertError.message }

  // Marquer toutes les réservations sélectionnées comme facturées
  await supabase.from('reservations').update({ fact_statut: 'facture' }).in('id', reservationIds)

  revalidatePath('/facturation')
  revalidatePath('/dossiers')
  revalidatePath('/reservations')
  return { success: true, id: (created as Record<string, string>).id }
}

export async function deleteFactureAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('factures').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/facturation')
  return { success: true }
}
