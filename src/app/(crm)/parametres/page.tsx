import { getSettings } from '@/app/actions/settings'
import ParametresClient from '@/components/parametres/ParametresClient'

export default async function Page() {
  const settings = await getSettings()
  return <ParametresClient settings={settings} />
}
