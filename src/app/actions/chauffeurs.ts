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

export async function updateStatutChauffeurAction(id: string, statut: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').update({ statut }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/chauffeurs')
  return { success: true }
}

export async function getChauffeursWithStats() {
  const supabase = await createClient()
  const now = new Date()
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const fin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const [chauffeursRes, resasMoisRes] = await Promise.all([
    supabase.from('chauffeurs').select('*').order('nom'),
    supabase.from('reservations').select('chauffeur_id, date, statut').gte('date', debut).lte('date', fin).neq('statut', 'cancelled'),
  ])
  if (chauffeursRes.error) throw chauffeursRes.error

  const missionsByChauf: Record<string, number> = {}
  for (const r of resasMoisRes.data ?? []) {
    if (r.chauffeur_id) missionsByChauf[r.chauffeur_id] = (missionsByChauf[r.chauffeur_id] ?? 0) + 1
  }

  return (chauffeursRes.data ?? []).map((c) => ({
    ...c,
    missions_mois: missionsByChauf[c.id] ?? 0,
  }))
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
