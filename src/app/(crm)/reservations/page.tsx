import { getReservations } from '@/app/actions/reservations'
import { getClients } from '@/app/actions/clients'
import { getChauffeurs } from '@/app/actions/chauffeurs'
import { getPartenaires } from '@/app/actions/partenaires'
import { getDossiers } from '@/app/actions/dossiers'
import ReservationsClient from '@/components/reservations/ReservationsClient'

export default async function ReservationsPage() {
  const [reservations, clients, chauffeurs, partenaires, dossiersRaw] = await Promise.all([
    getReservations(),
    getClients(),
    getChauffeurs(),
    getPartenaires(),
    getDossiers(),
  ])
  const dossiers = (dossiersRaw as { id: string; nom: string }[]).map((d) => ({ id: d.id, nom: d.nom }))
  return (
    <ReservationsClient
      initialReservations={reservations}
      clients={clients}
      chauffeurs={chauffeurs}
      partenaires={partenaires}
      dossiers={dossiers}
    />
  )
}
