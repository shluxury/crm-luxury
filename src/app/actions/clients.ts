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
  pref_notes_chauffeur: z.string().optional(),
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
