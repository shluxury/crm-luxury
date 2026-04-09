import { getClientsWithStats } from '@/app/actions/clients'
import ClientsClient from '@/components/clients/ClientsClient'

export default async function ClientsPage() {
  const clients = await getClientsWithStats()
  return <ClientsClient initialClients={clients} />
}
