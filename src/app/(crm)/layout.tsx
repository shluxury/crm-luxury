import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import Sidebar from '@/components/layout/Sidebar'
import { SettingsProvider } from '@/components/providers/SettingsProvider'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settings = await getSettings()

  return (
    <SettingsProvider settings={settings}>
      <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
        <Sidebar userEmail={user.email ?? ''} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </main>
      </div>
    </SettingsProvider>
  )
}
