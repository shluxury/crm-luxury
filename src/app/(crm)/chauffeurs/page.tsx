import { getChauffeurs } from "@/app/actions/chauffeurs"
import ChauffeursClient from "@/components/chauffeurs/ChauffeursClient"

export default async function ChauffeursPage() {
  const chauffeurs = await getChauffeurs()
  return <ChauffeursClient initialChauffeurs={chauffeurs} />
}
