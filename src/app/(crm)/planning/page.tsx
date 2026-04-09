import { getReservations } from '@/app/actions/reservations'
import PlanningClient from '@/components/planning/PlanningClient'

export default async function Page() {
  const reservations = await getReservations()
  return <PlanningClient reservations={reservations as Record<string, unknown>[]} />
}
