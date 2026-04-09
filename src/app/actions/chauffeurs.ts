'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ChauffeurSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  tel: z.string().optional().default(''),
  email: z.string().optional().default(''),
  statut: z.enum(['disponible', 'indisponible', 'en_mission']).default('disponible'),
  langues: z.array(z.string()).default([]),
  numero_vtc: z.string().optional().default(''),
})

type ChauffeurInput = z.infer<typeof ChauffeurSchema>

export async function getChauffeurs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chauffeurs')
    .select('*')
    .order('nom', { ascending: true })
  if (error) throw error
  return data
}

export async function createChauffeurAction(input: ChauffeurInput) {
  const parsed = ChauffeurSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}

export async function updateChauffeurAction(id: string, input: ChauffeurInput) {
  const parsed = ChauffeurSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}

export async function deleteChauffeurAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}
