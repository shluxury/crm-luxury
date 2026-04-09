import { getChauffeursWithStats } from "@/app/actions/chauffeurs"
import ChauffeursClient from "@/components/chauffeurs/ChauffeursClient"

export default async function ChauffeursPage() {
  const chauffeurs = await getChauffeursWithStats()
  return <ChauffeursClient initialChauffeurs={chauffeurs} />
}
