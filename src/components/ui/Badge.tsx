import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-neutral-800 text-neutral-300',
  success: 'bg-green-950/60 text-green-400 border border-green-900',
  warning: 'bg-yellow-950/60 text-yellow-400 border border-yellow-900',
  danger: 'bg-red-950/60 text-red-400 border border-red-900',
  info: 'bg-blue-950/60 text-blue-400 border border-blue-900',
  gold: 'bg-[#C9A060]/10 text-[#C9A060] border border-[#C9A060]/30',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// Helpers statuts réservation
export function statutReservationBadge(statut: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    devis: { label: 'Devis', variant: 'warning' },
    confirmed: { label: 'Confirmé', variant: 'info' },
    paid: { label: 'Payé', variant: 'success' },
    part_paid: { label: 'Partiel', variant: 'gold' },
    completed: { label: 'Terminé', variant: 'default' },
    cancelled: { label: 'Annulé', variant: 'danger' },
  }
  return map[statut] ?? { label: statut, variant: 'default' as BadgeVariant }
}
