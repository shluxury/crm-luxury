import { getDossiers } from '@/app/actions/dossiers'
import { getClients } from '@/app/actions/clients'
import DossiersClient from '@/components/dossiers/DossiersClient'

export default async function Page() {
  const [dossiers, clients] = await Promise.all([getDossiers(), getClients()])
  return <DossiersClient initialDossiers={dossiers as Record<string, unknown>[]} clients={clients} />
}
