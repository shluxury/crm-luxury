'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'

export interface SearchResult {
  type: 'client' | 'reservation' | 'chauffeur' | 'partenaire' | 'facture'
  id: string
  label: string
  sublabel?: string
  href: string
}

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  try { await requireAuth() } catch { return [] }
  if (!query || query.trim().length < 2) return []

  // Sanitize: garder uniquement alphanumérique + espaces + tirets pour éviter injection PostgREST
  const q = query.trim().toLowerCase().slice(0, 100).replace(/[%_\\]/g, '')
  if (!q) return []
  const supabase = await createClient()

  const [clientsRes, resasRes, chauffeursRes, partenairesRes, facturesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, prenom, nom, email, tel, corp_nom')
      .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%,corp_nom.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('reservations')
      .select('id, service, date, depart, destination, statut')
      .or(`service.ilike.%${q}%,depart.ilike.%${q}%,destination.ilike.%${q}%,id.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('chauffeurs')
      .select('id, nom, tel, email')
      .or(`nom.ilike.%${q}%,tel.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(3),
    supabase
      .from('partenaires')
      .select('id, nom, contact, email')
      .or(`nom.ilike.%${q}%,contact.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(3),
    supabase
      .from('factures')
      .select('id, numero, montant, currency, statut')
      .ilike('numero', `%${q}%`)
      .limit(3),
  ])

  const results: SearchResult[] = []

  // Clients
  for (const c of clientsRes.data ?? []) {
    const label = c.corp_nom || `${c.prenom} ${c.nom}`
    results.push({
      type: 'client',
      id: c.id,
      label,
      sublabel: c.email || c.tel || undefined,
      href: `/clients`,
    })
  }

  // Réservations
  for (const r of resasRes.data ?? []) {
    results.push({
      type: 'reservation',
      id: r.id,
      label: r.service,
      sublabel: [r.date, r.depart, r.destination].filter(Boolean).join(' · '),
      href: `/reservations`,
    })
  }

  // Chauffeurs
  for (const c of chauffeursRes.data ?? []) {
    results.push({
      type: 'chauffeur',
      id: c.id,
      label: c.nom,
      sublabel: c.tel || c.email || undefined,
      href: `/chauffeurs`,
    })
  }

  // Partenaires
  for (const p of partenairesRes.data ?? []) {
    results.push({
      type: 'partenaire',
      id: p.id,
      label: p.nom,
      sublabel: p.contact || p.email || undefined,
      href: `/partenaires`,
    })
  }

  // Factures
  for (const f of facturesRes.data ?? []) {
    results.push({
      type: 'facture',
      id: f.id,
      label: `Facture ${f.numero}`,
      sublabel: `${f.currency} ${f.montant} · ${f.statut}`,
      href: `/facturation`,
    })
  }

  return results
}
