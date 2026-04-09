import { getPartenaires } from "@/app/actions/partenaires"
import { createClient } from "@/lib/supabase/server"
import PartenairesClient from "@/components/partenaires/PartenairesClient"

export interface PartenaireStats {
  missions_total: number
  missions_mois: number
  ca_total: number
  du_mois: number
}

export default async function PartenairesPage() {
  const supabase = await createClient()
  const now = new Date()
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const fin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const [partenaires, { data: resasRaw }] = await Promise.all([
    getPartenaires(),
    supabase
      .from('reservations')
      .select('partenaire_id, montant, cout, statut, date')
      .not('partenaire_id', 'is', null),
  ])

  // Calcul des stats par partenaire
  const statsMap: Record<string, PartenaireStats> = {}
  for (const r of (resasRaw ?? []) as { partenaire_id: string; montant: number; cout: number; statut: string; date: string }[]) {
    if (!r.partenaire_id || r.statut === 'cancelled') continue
    if (!statsMap[r.partenaire_id]) statsMap[r.partenaire_id] = { missions_total: 0, missions_mois: 0, ca_total: 0, du_mois: 0 }
    statsMap[r.partenaire_id].missions_total++
    statsMap[r.partenaire_id].ca_total += r.cout ?? 0
    if (r.date >= debut && r.date <= fin) {
      statsMap[r.partenaire_id].missions_mois++
      statsMap[r.partenaire_id].du_mois += r.cout ?? 0
    }
  }

  return <PartenairesClient initialPartenaires={partenaires} statsMap={statsMap} />
}
