import { getFactures } from '@/app/actions/factures'
import { getClients } from '@/app/actions/clients'
import FacturationClient from '@/components/facturation/FacturationClient'

export default async function Page() {
  const [factures, clients] = await Promise.all([getFactures(), getClients()])
  return <FacturationClient initialFactures={factures as Record<string, unknown>[]} clients={clients} />
}
