'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Car,
  Handshake,
  FolderOpen,
  Receipt,
  Map,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reservations', label: 'Réservations', icon: CalendarDays },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/chauffeurs', label: 'Chauffeurs', icon: Car },
  { href: '/partenaires', label: 'Partenaires', icon: Handshake },
  { href: '/dossiers', label: 'Dossiers', icon: FolderOpen },
  { href: '/facturation', label: 'Facturation', icon: Receipt },
  { href: '/planning', label: 'Planning', icon: Map },
]

interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-neutral-800 bg-neutral-900">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-neutral-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A060]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7v10l10 5 10-5V7L12 2z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">CRM Luxury</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-[#C9A060]/10 text-[#C9A060]'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Assistant IA */}
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <Link
            href="/agent"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/agent'
                ? 'bg-[#C9A060]/10 text-[#C9A060]'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            )}
          >
            <Sparkles size={16} strokeWidth={1.75} />
            Assistant IA
          </Link>
        </div>
      </nav>

      {/* Footer : user + settings + logout */}
      <div className="border-t border-neutral-800 px-2 py-3">
        <Link
          href="/parametres"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/parametres'
              ? 'bg-[#C9A060]/10 text-[#C9A060]'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          )}
        >
          <Settings size={16} strokeWidth={1.75} />
          Paramètres
        </Link>

        <div className="mt-1 flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs text-neutral-300">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-xs text-neutral-400">{userEmail}</span>
          <form action={logout}>
            <button
              type="submit"
              title="Se déconnecter"
              className="text-neutral-500 transition hover:text-red-400"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
