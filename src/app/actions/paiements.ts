'use server'

import { getSettings } from '@/app/actions/settings'
import { createClient } from '@/lib/supabase/server'

const CURRENCY_MAP: Record<string, string> = {
  EUR: 'eur',
  USD: 'usd',
  AED: 'aed',
  GBP: 'gbp',
}

export async function createStripePaymentLinkAction(reservationId: string): Promise<{ url?: string; error?: string }> {
  const settings = await getSettings()
  const secretKey = settings.integrations.stripe_secret_key
  if (!secretKey) return { error: 'Clé Stripe non configurée (Paramètres > Intégrations)' }

  const supabase = await createClient()
  const { data: resaRaw, error } = await supabase
    .from('reservations')
    .select('*, client:clients(prenom, nom, email)')
    .eq('id', reservationId)
    .single()

  if (error || !resaRaw) return { error: 'Réservation introuvable' }

  const resa = resaRaw as unknown as Record<string, unknown>
  const client = resa.client as Record<string, string> | null
  const montant = (resa.montant_percu as number) || (resa.montant as number) || 0
  const currency = CURRENCY_MAP[(resa.currency as string) ?? 'EUR'] ?? 'eur'

  if (montant <= 0) return { error: 'Montant invalide (0)' }

  const description = `Réservation ${resa.date} - ${client ? `${client.prenom} ${client.nom}` : 'Client'}`

  try {
    // Crée un Payment Link Stripe via l'API REST
    // 1. Crée d'abord un Price object
    const priceRes = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'unit_amount': String(Math.round(montant * 100)),
        'currency': currency,
        'product_data[name]': description,
      }),
    })

    if (!priceRes.ok) {
      const err = await priceRes.json() as { error?: { message: string } }
      return { error: err.error?.message ?? 'Erreur Stripe (price)' }
    }

    const price = await priceRes.json() as { id: string }

    // 2. Crée le Payment Link
    const linkRes = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': price.id,
        'line_items[0][quantity]': '1',
        ...(client?.email ? { 'customer_email': client.email } : {}),
      }),
    })

    if (!linkRes.ok) {
      const err = await linkRes.json() as { error?: { message: string } }
      return { error: err.error?.message ?? 'Erreur Stripe (link)' }
    }

    const link = await linkRes.json() as { url: string }
    return { url: link.url }
  } catch (e) {
    return { error: `Erreur réseau: ${String(e)}` }
  }
}
