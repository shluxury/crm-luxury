'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const PartenaireSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  contact: z.string().optional().default(''),
  tel: z.string().optional().default(''),
  email: z.string().optional().default(''),
  zone: z.string().optional().default(''),
  siret: z.string().optional().default(''),
  tva: z.string().optional().default(''),
  forme_juridique: z.string().optional().default(''),
  iban: z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  cp: z.string().optional().default(''),
  ville: z.string().optional().default(''),
  pays: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  has_monaco: z.boolean().default(false),
})

type PartenaireInput = z.infer<typeof PartenaireSchema>

export async function getPartenaires() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partenaires')
    .select('*')
    .order('nom', { ascending: true })
  if (error) throw error
  return data
}

export async function createPartenaireAction(input: PartenaireInput) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = PartenaireSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('partenaires').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/partenaires')
  return { success: true }
}

export async function updatePartenaireAction(id: string, input: PartenaireInput) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = PartenaireSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('partenaires').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/partenaires')
  return { success: true }
}

export async function deletePartenaireAction(id: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const supabase = await createClient()
  const { error } = await supabase.from('partenaires').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/partenaires')
  return { success: true }
}
