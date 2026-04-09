import { getReservations } from "@/app/actions/reservations"
import { getClients } from "@/app/actions/clients"
import { getChauffeurs } from "@/app/actions/chauffeurs"
import { getPartenaires } from "@/app/actions/partenaires"
import ReservationsClient from "@/components/reservations/ReservationsClient"

export default async function ReservationsPage() {
  const [reservations, clients, chauffeurs, partenaires] = await Promise.all([
    getReservations(),
    getClients(),
    getChauffeurs(),
    getPartenaires(),
  ])
  return <ReservationsClient initialReservations={reservations} clients={clients} chauffeurs={chauffeurs} partenaires={partenaires} />
}
