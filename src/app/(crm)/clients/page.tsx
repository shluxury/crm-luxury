import { getClients } from '@/app/actions/clients'
import ClientsClient from '@/components/clients/ClientsClient'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientsClient initialClients={clients} />
}
