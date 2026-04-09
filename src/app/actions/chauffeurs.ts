'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
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

const STATUT_CHAUFFEUR = ['disponible', 'indisponible', 'en_mission'] as const

export async function updateStatutChauffeurAction(id: string, statut: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  if (!(STATUT_CHAUFFEUR as readonly string[]).includes(statut)) return { error: 'Statut invalide' }
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
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = ChauffeurSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}

export async function updateChauffeurAction(id: string, input: ChauffeurInput) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const parsed = ChauffeurSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}

export async function deleteChauffeurAction(id: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const supabase = await createClient()
  const { error } = await supabase.from('chauffeurs').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/chauffeurs')
  return { success: true }
}

export interface ChauffeurMission {
  id: string
  service: string
  date: string
  heure: string
  depart: string | null
  destination: string | null
  vehicule: string | null
  statut: string
  client_id: string | null
  currency: string
  montant_percu: number
  montant: number
}

export interface ChauffeurFicheData {
  prochaines: ChauffeurMission[]
  passees: ChauffeurMission[]
  missions_mois: number
  missions_total: number
  services_frequents: { service: string; count: number }[]
}

export async function getChauffeurMissions(chauffeurId: string): Promise<ChauffeurFicheData> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const debutMois = today.slice(0, 8) + '01'

  const { data, error } = await supabase
    .from('reservations')
    .select('id, service, date, heure, depart, destination, vehicule, statut, client_id, currency, montant_percu, montant')
    .eq('chauffeur_id', chauffeurId)
    .neq('statut', 'cancelled')
    .order('date', { ascending: true })

  if (error) throw error

  const all = (data ?? []) as ChauffeurMission[]
  const prochaines = all.filter((r) => r.date >= today)
  const passees = all.filter((r) => r.date < today).reverse()
  const missions_mois = all.filter((r) => r.date >= debutMois && r.date <= today).length
  const missions_total = all.length

  // Services les plus fréquents
  const serviceCount: Record<string, number> = {}
  for (const r of all) {
    serviceCount[r.service] = (serviceCount[r.service] ?? 0) + 1
  }
  const services_frequents = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([service, count]) => ({ service, count }))

  return { prochaines, passees, missions_mois, missions_total, services_frequents }
}
