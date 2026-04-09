'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getDashboardStats() {
  const supabase = await createClient()
  const now = new Date()
  const start = format(startOfMonth(now), 'yyyy-MM-dd')
  const end = format(endOfMonth(now), 'yyyy-MM-dd')

  const [reservationsRes, clientsRes, chauffeursRes] = await Promise.all([
    supabase.from('reservations').select('id, statut, montant, montant_percu, cout, currency, entite, date')
      .gte('date', start).lte('date', end),
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('chauffeurs').select('id, statut', { count: 'exact' }),
  ])

  const reservations = reservationsRes.data ?? []
  const totalClients = clientsRes.count ?? 0
  const chauffeurs = chauffeursRes.data ?? []

  const encaissements = reservations
    .filter((r) => ['paid', 'part_paid'].includes(r.statut))
    .reduce((sum, r) => sum + (r.montant_percu ?? 0), 0)

  const ca = reservations
    .filter((r) => r.statut !== 'cancelled')
    .reduce((sum, r) => sum + (r.montant ?? 0), 0)

  const missions_mois = reservations.filter((r) => r.statut !== 'cancelled').length
  const en_attente = reservations.filter((r) => r.statut === 'confirmed').length
  const chauffeurs_dispos = chauffeurs.filter((c) => c.statut === 'disponible').length

  return {
    encaissements,
    ca,
    missions_mois,
    en_attente,
    total_clients: totalClients,
    chauffeurs_dispos,
    reservations_recentes: reservations.slice(0, 5),
  }
}
