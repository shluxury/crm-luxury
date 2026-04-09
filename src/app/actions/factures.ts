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
  statut: z.enum(['draft', 'sent', 'paid']).default('draft'),
  notes: z.string().optional().default(''),
  reservation_id: z.string().uuid().optional().nullable(),
  dossier_id: z.string().uuid().optional().nullable(),
})

type FactureInput = z.infer<typeof FactureSchema>

export async function getFactures() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('factures')
    .select('*, client:clients(id, prenom, nom)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
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

export async function deleteFactureAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('factures').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/facturation')
  return { success: true }
}
