import { getDashboardStats } from '@/app/actions/dashboard'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const stats = await getDashboardStats(year, month)

  return <DashboardClient initialStats={stats} initialYear={year} initialMonth={month} />
}
