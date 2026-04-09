'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'
import GlobalSearch from './GlobalSearch'
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
  Sun,
  Moon,
  Search,
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
  const { theme, toggleTheme } = useTheme()

  return (
    <>
    <GlobalSearch />
    <aside
      className="flex w-56 flex-shrink-0 flex-col"
      style={{
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2.5 px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
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
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>CRM Luxury</span>
      </div>

      {/* Recherche globale */}
      <div className="px-2 pt-2 pb-1">
        <button
          onClick={() => {
            // Déclenche l'event Cmd+K pour ouvrir GlobalSearch
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          title="Recherche globale (⌘K)"
        >
          <Search size={12} className="flex-shrink-0" />
          <span className="flex-1 text-left text-neutral-500">Rechercher...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] text-neutral-600">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
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
                      ? 'text-[#C9A060]'
                      : ''
                  )}
                  style={
                    active
                      ? { background: 'rgba(201,160,96,0.10)' }
                      : { color: 'var(--text-muted)' }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-3)'
                      ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = ''
                      ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Assistant IA */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <Link
            href="/agent"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/agent' ? 'text-[#C9A060]' : ''
            )}
            style={
              pathname === '/agent'
                ? { background: 'rgba(201,160,96,0.10)' }
                : { color: 'var(--text-muted)' }
            }
          >
            <Sparkles size={16} strokeWidth={1.75} />
            Assistant IA
          </Link>
        </div>
      </nav>

      {/* Footer : theme toggle + user + settings + logout */}
      <div className="px-2 py-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-3)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = ''
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)'
          }}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>

        <Link
          href="/parametres"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/parametres' ? 'text-[#C9A060]' : ''
          )}
          style={
            pathname === '/parametres'
              ? { background: 'rgba(201,160,96,0.10)' }
              : { color: 'var(--text-muted)' }
          }
        >
          <Settings size={16} strokeWidth={1.75} />
          Paramètres
        </Link>

        <div className="mt-1 flex items-center gap-2.5 px-3 py-2">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs"
            style={{ background: 'var(--bg-4)', color: 'var(--text-muted)' }}
          >
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-xs" style={{ color: 'var(--text-dim)' }}>{userEmail}</span>
          <form action={logout}>
            <button
              type="submit"
              title="Se déconnecter"
              className="transition"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E05252')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
    </>
  )
}
