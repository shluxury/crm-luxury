'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { getSettings } from '@/app/actions/settings'
import { buildEmail, type EmailTemplate } from '@/lib/email-templates'

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

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
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
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

export async function sendFactureEmailAction(factureId: string, toEmail: string, toName: string, customMessage?: string) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  const [settings, supabase] = await Promise.all([getSettings(), createClient()])

  const brevoKey = settings.email.brevo_key
  if (!brevoKey) return { error: 'Clé Brevo non configurée dans les Paramètres > Intégrations' }

  const { data: factureRaw, error: factureError } = await supabase
    .from('factures')
    .select('*, client:clients(*)')
    .eq('id', factureId)
    .single()
  if (factureError || !factureRaw) return { error: 'Facture introuvable' }

  const facture = factureRaw as unknown as Record<string, unknown>
  const client = facture.client as Record<string, unknown> | null
  const entiteConfig = settings.entites.find((e) => e.id === (facture.entite as string)) ?? settings.entites[0]

  const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/pdf/facture/${factureId}`
  const clientName = client ? `${client.prenom} ${client.nom}` : toName

  const currency = (facture.currency as string) ?? 'EUR'
  const montant = Math.round((facture.montant as number) ?? 0).toLocaleString('fr-FR')
  const numero = (facture.numero as string) ?? ''

  const subject = `Votre facture ${numero} - ${montant} ${currency}`

  const messageHtml = customMessage
    ? `<p style="font-size:14px;color:#333;margin-bottom:16px;">${escHtml(customMessage).replace(/\n/g, '<br>')}</p>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;padding:32px 0;">
      <div style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <div style="background:#1a1a2e;padding:24px 32px;">
          <p style="color:#C9A060;font-size:18px;font-weight:600;margin:0;">${entiteConfig?.nom ?? ''}</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="font-size:15px;color:#333;margin:0 0 8px;">Cher(e) ${clientName},</p>
          ${messageHtml}
          <p style="font-size:14px;color:#555;margin:0 0 20px;">Veuillez trouver ci-joint votre facture <strong>${numero}</strong> d'un montant de <strong>${montant} ${currency}</strong>.</p>
          <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:12px;color:#888;padding:4px 0;">Numéro</td><td style="font-size:12px;color:#333;font-weight:600;text-align:right;">${numero}</td></tr>
              <tr><td style="font-size:12px;color:#888;padding:4px 0;">Montant</td><td style="font-size:14px;color:#1a1a2e;font-weight:700;text-align:right;">${montant} ${currency}</td></tr>
            </table>
          </div>
          <a href="${pdfUrl}" style="display:inline-block;background:#C9A060;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:600;">
            Télécharger la facture PDF
          </a>
          <p style="font-size:12px;color:#888;margin-top:20px;">Cordialement,<br>${entiteConfig?.nom ?? ''}</p>
        </div>
      </div>
    </div>
  `

  const senderEmail = entiteConfig?.email || 'noreply@example.com'
  const senderName = entiteConfig?.nom || 'Conciergerie'

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
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

  // Passer le statut à 'sent' si encore en 'draft'
  const factureStatut = (facture.statut as string) ?? ''
  if (factureStatut === 'draft') {
    await supabase.from('factures').update({ statut: 'sent' }).eq('id', factureId)
  }

  return { success: true, newStatut: factureStatut === 'draft' ? 'sent' : factureStatut }
}

export async function getEmailPreview(template: EmailTemplate, reservationId: string, lang: 'fr' | 'en' = 'fr') {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
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
