'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DossierSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  client_id: z.string().uuid().optional().nullable(),
  entite: z.enum(['leader_limousines', 'leader_concierge_dubai']).default('leader_limousines'),
  statut: z.enum(['ouvert', 'ferme', 'archive']).default('ouvert'),
  notes: z.string().optional().default(''),
  montant_percu: z.coerce.number().min(0).default(0),
})

type DossierInput = z.infer<typeof DossierSchema>

export async function getDossiers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dossiers')
    .select('*, client:clients(id, prenom, nom)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createDossierAction(input: DossierInput) {
  const parsed = DossierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('dossiers').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/dossiers')
  return { success: true }
}

export async function updateDossierAction(id: string, input: DossierInput) {
  const parsed = DossierSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('dossiers').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dossiers')
  return { success: true }
}

export async function deleteDossierAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dossiers').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dossiers')
  return { success: true }
}
