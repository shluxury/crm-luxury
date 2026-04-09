import { createClient } from '@/lib/supabase/server'
import { getClients } from '@/app/actions/clients'
import DossiersClient from '@/components/dossiers/DossiersClient'

export default async function Page() {
  const supabase = await createClient()

  const [dossiersRes, resasRes, clients] = await Promise.all([
    supabase
      .from('dossiers')
      .select('*, client:clients(id, prenom, nom)')
      .order('created_at', { ascending: false }),
    supabase
      .from('reservations')
      .select('id, dossier_id, date, heure, service, statut, montant, montant_percu, depart, destination, resto, vehicule, currency')
      .not('dossier_id', 'is', null)
      .neq('statut', 'cancelled'),
    getClients(),
  ])

  const dossiers = (dossiersRes.data ?? []) as Record<string, unknown>[]
  const resas = (resasRes.data ?? []) as Record<string, unknown>[]

  // Attacher les réservations à chaque dossier
  const dossiersWithResas = dossiers.map((d) => {
    const dosResas = resas
      .filter((r) => r.dossier_id === d.id)
      .sort((a, b) => ((a.date as string) ?? '') > ((b.date as string) ?? '') ? 1 : -1)
    const total = dosResas.reduce((s, r) => s + ((r.montant as number) ?? 0), 0)
    return { ...d, reservations: dosResas, total_dossier: total }
  })

  return <DossiersClient initialDossiers={dossiersWithResas} clients={clients} />
}
