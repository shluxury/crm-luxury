'use server'

import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import { buildEmail, type EmailTemplate } from '@/lib/email-templates'

interface SendEmailParams {
  template: EmailTemplate
  reservationId: string
  toEmail: string
  toName: string
  lang?: 'fr' | 'en'
  chauffeurNom?: string
  customSubject?: string
  customHtml?: string
}

export async function sendEmailAction(params: SendEmailParams) {
  const { template, reservationId, toEmail, toName, lang = 'fr', chauffeurNom, customSubject, customHtml } = params

  const [settings, supabase] = await Promise.all([getSettings(), createClient()])

  // Récupérer la réservation + client
  const { data: resaRaw, error: resaError } = await supabase
    .from('reservations')
    .select('*, client:clients(*)')
    .eq('id', reservationId)
    .single()
  if (resaError || !resaRaw) return { error: 'Réservation introuvable' }
  const reservation = resaRaw as unknown as Record<string, unknown>

  const client = reservation.client as Record<string, unknown>
  const entiteConfig = settings.entites.find((e) => e.id === reservation.entite)
  if (!entiteConfig) return { error: 'Entité introuvable dans les paramètres' }

  const brevoKey = settings.email.brevo_key
  if (!brevoKey) return { error: 'Clé Brevo non configurée dans les Paramètres > Intégrations' }

  let subject: string
  let html: string

  if (customSubject && customHtml) {
    subject = customSubject
    html = customHtml
  } else {
    // Vérifier si un modèle personnalisé existe dans les settings
    // Chercher d'abord dans 'concierge' pour les types héli/jet/restaurant/location, sinon 'global'
    const serviceType = String(reservation.service ?? '')
    const isConcierge = ['helicoptere', 'jet_prive', 'restaurant', 'location_voiture'].includes(serviceType)
    const scope = isConcierge ? 'concierge' : 'global'
    const customTemplate = settings.email_templates?.[scope]?.[template]?.[lang]
    if (customTemplate?.html) {
      const vars: Record<string, string> = {
        prenom: String(client.prenom ?? ''),
        nom: String(client.nom ?? ''),
        service: String(reservation.service ?? ''),
        date: reservation.date ? new Date(reservation.date as string).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '',
        heure: (reservation.heure as string)?.slice(0, 5) ?? '',
        depart: String(reservation.depart ?? ''),
        destination: String(reservation.destination ?? ''),
        num_vol: String(reservation.num_vol ?? ''),
        vehicule: String(reservation.vehicule ?? ''),
        pax: String(reservation.pax ?? ''),
        montant: String(reservation.montant ?? ''),
        currency: String(reservation.currency ?? 'EUR'),
        entite_nom: entiteConfig.nom,
        entite_tel: entiteConfig.tel,
        entite_email: entiteConfig.email,
        notes: String(reservation.notes ?? ''),
      }
      subject = customTemplate.subject
        ? customTemplate.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
        : ''
      html = customTemplate.html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
      if (!subject) {
        // Fallback au sujet généré
        const built = buildEmail(template, { reservation, client, entite: entiteConfig, lang, chauffeurNom })
        subject = built.subject
      }
    } else {
      const built = buildEmail(template, {
        reservation: reservation as unknown as Record<string, unknown>,
        client,
        entite: entiteConfig,
        lang,
        chauffeurNom,
      })
      subject = built.subject
      html = built.html
    }
  }

  const senderEmail = entiteConfig.email || 'noreply@example.com'
  const senderName = entiteConfig.nom || 'Conciergerie'

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: `Erreur Brevo: ${(err as Record<string, unknown>).message ?? response.statusText}` }
  }

  return { success: true }
}

export async function getEmailPreview(template: EmailTemplate, reservationId: string, lang: 'fr' | 'en' = 'fr') {
  const [settings, supabase] = await Promise.all([getSettings(), createClient()])

  const { data: resaRaw2, error } = await supabase
    .from('reservations')
    .select('*, client:clients(*)')
    .eq('id', reservationId)
    .single()
  if (error || !resaRaw2) return { error: 'Réservation introuvable' }
  const reservation2 = resaRaw2 as unknown as Record<string, unknown>

  const client = reservation2.client as Record<string, unknown>
  const entiteConfig = settings.entites.find((e) => e.id === reservation2.entite) ?? settings.entites[0]

  const { subject, html } = buildEmail(template, {
    reservation: reservation2,
    client,
    entite: entiteConfig,
    lang,
  })

  const toEmail = (client?.email as string) ?? ''
  const toName = client ? `${client.prenom} ${client.nom}` : ''

  return { subject, html, toEmail, toName }
}
