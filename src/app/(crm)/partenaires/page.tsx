import { getPartenaires } from "@/app/actions/partenaires"
import PartenairesClient from "@/components/partenaires/PartenairesClient"

export default async function PartenairesPage() {
  const partenaires = await getPartenaires()
  return <PartenairesClient initialPartenaires={partenaires} />
}
