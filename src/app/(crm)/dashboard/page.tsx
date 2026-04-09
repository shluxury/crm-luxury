import { getDashboardStats } from "@/app/actions/dashboard"
import { TrendingUp, CalendarDays, Users, Car, Clock, Euro } from "lucide-react"

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-400">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800">
          <Icon size={15} className="text-neutral-400" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-neutral-400">Activite du mois en cours</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Encaissements du mois" value={`${stats.encaissements.toLocaleString()} EUR`} icon={Euro} sub="montants pergus" />
        <StatCard label="CA du mois" value={`${stats.ca.toLocaleString()} EUR`} icon={TrendingUp} sub="total facture" />
        <StatCard label="Missions du mois" value={stats.missions_mois} icon={CalendarDays} sub={`${stats.en_attente} en attente de confirmation`} />
        <StatCard label="Missions en attente" value={stats.en_attente} icon={Clock} sub="a confirmer" />
        <StatCard label="Total clients" value={stats.total_clients} icon={Users} />
        <StatCard label="Chauffeurs disponibles" value={stats.chauffeurs_dispos} icon={Car} />
      </div>
    </div>
  )
}
