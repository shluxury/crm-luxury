import type { Reservation, Client } from '@/types/database'
import type { EntiteConfig } from '@/types/database'

type Lang = 'fr' | 'en'

interface EmailData {
  reservation: Record<string, unknown>
  client: Record<string, unknown>
  entite: EntiteConfig
  lang: Lang
}

const SERVICE_LABELS: Record<string, Record<Lang, string>> = {
  transfert_aeroport: { fr: 'Transfert aéroport', en: 'Airport transfer' },
  transfert_simple: { fr: 'Transfert', en: 'Transfer' },
  mise_a_disposition: { fr: 'Mise à disposition', en: 'Chauffeur on call' },
  helicoptere: { fr: 'Hélicoptère', en: 'Helicopter' },
  jet_prive: { fr: 'Jet privé', en: 'Private jet' },
  restaurant: { fr: 'Réservation restaurant', en: 'Restaurant booking' },
  location_voiture: { fr: 'Location véhicule', en: 'Car rental' },
}

function base(title: string, body: string, entite: EntiteConfig) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;">
  <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#C9A060;letter-spacing:0.5px;">${entite.nom || 'Conciergerie'}</h1>
    ${entite.tel ? `<p style="margin:4px 0 0;font-size:13px;color:#888;">${entite.tel}</p>` : ''}
  </td></tr>
  <tr><td style="padding:32px 40px;">
    ${body}
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
    <p style="margin:0;font-size:11px;color:#555;">${entite.nom || ''} ${entite.adresse ? '· ' + entite.adresse : ''}</p>
    ${entite.email ? `<p style="margin:4px 0 0;font-size:11px;color:#555;"><a href="mailto:${entite.email}" style="color:#C9A060;">${entite.email}</a></p>` : ''}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#888;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#e0e0e0;font-weight:500;">${value}</td>
  </tr>`
}

export function buildConfirmationEmail({ reservation: r, client: c, entite, lang }: EmailData): { subject: string; html: string } {
  const isFr = lang === 'fr'
  const service = SERVICE_LABELS[r.service as string]?.[lang] ?? String(r.service)
  const date = new Date(r.date as string).toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heure = (r.heure as string)?.slice(0, 5) ?? ''

  const subject = isFr
    ? `Confirmation de votre réservation — ${service} le ${date}`
    : `Booking confirmation — ${service} on ${date}`

  const rows = [
    infoRow(isFr ? 'Service' : 'Service', service),
    infoRow(isFr ? 'Date' : 'Date', date),
    infoRow(isFr ? 'Heure' : 'Time', heure),
    r.depart ? infoRow(isFr ? 'Départ' : 'Pick-up', String(r.depart)) : '',
    r.destination ? infoRow(isFr ? 'Destination' : 'Destination', String(r.destination)) : '',
    r.num_vol ? infoRow(isFr ? 'Vol' : 'Flight', String(r.num_vol)) : '',
    r.vehicule ? infoRow(isFr ? 'Véhicule' : 'Vehicle', String(r.vehicule)) : '',
    r.pax ? infoRow(isFr ? 'Passagers' : 'Passengers', String(r.pax)) : '',
    r.resto ? infoRow(isFr ? 'Restaurant' : 'Restaurant', String(r.resto)) : '',
  ].filter(Boolean).join('')

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;">${isFr ? `Bonjour ${c.prenom},` : `Dear ${c.prenom},`}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.6;">
      ${isFr ? 'Nous avons le plaisir de confirmer votre réservation :' : 'We are pleased to confirm your booking:'}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      ${rows}
    </table>
    ${r.notes ? `<p style="margin:0 0 24px;font-size:13px;color:#aaa;background:#111;border-radius:8px;padding:16px 20px;border-left:3px solid #C9A060;">${String(r.notes)}</p>` : ''}
    <p style="margin:0;font-size:14px;color:#aaa;line-height:1.6;">
      ${isFr
        ? 'Pour toute question, n\'hésitez pas à nous contacter. Nous restons à votre disposition.'
        : 'For any questions, please do not hesitate to contact us. We remain at your disposal.'}
    </p>
    <p style="margin:24px 0 0;font-size:14px;color:#888;">
      ${isFr ? 'Cordialement,' : 'Kind regards,'}<br>
      <strong style="color:#C9A060;">${entite.nom || 'L\'équipe'}</strong>
    </p>`

  return { subject, html: base(subject, body, entite) }
}

export function buildChauffeurBriefEmail({ reservation: r, client: c, entite, lang }: EmailData & { chauffeurNom?: string }): { subject: string; html: string } {
  const service = SERVICE_LABELS[r.service as string]?.['fr'] ?? String(r.service)
  const date = new Date(r.date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heure = (r.heure as string)?.slice(0, 5) ?? ''

  const subject = `Brief mission — ${service} — ${date} ${heure}`

  const rows = [
    infoRow('Date', date),
    infoRow('Heure RDV', heure),
    infoRow('Client', `${c.prenom} ${c.nom}`),
    (c as Record<string, unknown>).tel ? infoRow('Tél client', String((c as Record<string, unknown>).tel)) : '',
    r.depart ? infoRow('Prise en charge', String(r.depart)) : '',
    ...(Array.isArray(r.stops) && r.stops.length > 0
      ? (r.stops as string[]).map((s, i) => infoRow(`Arrêt ${i + 1}`, s))
      : []),
    r.destination ? infoRow('Destination', String(r.destination)) : '',
    r.num_vol ? infoRow('N° de vol', String(r.num_vol)) : '',
    r.vehicule ? infoRow('Véhicule', String(r.vehicule)) : '',
    r.pax ? infoRow('Passagers', String(r.pax)) : '',
    r.bagages ? infoRow('Bagages', String(r.bagages)) : '',
    r.nb_heures ? infoRow('Durée', `${r.nb_heures}h`) : '',
  ].filter(Boolean).join('')

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;">Brief de mission</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#aaa;">
      Merci de prendre en note les informations ci-dessous pour cette mission.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      ${rows}
    </table>
    ${r.notes ? `<div style="background:#111;border-radius:8px;padding:16px 20px;border-left:3px solid #C9A060;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#C9A060;text-transform:uppercase;letter-spacing:1px;">Notes</p>
      <p style="margin:0;font-size:13px;color:#ccc;">${String(r.notes)}</p>
    </div>` : ''}
    ${(c as Record<string, unknown>).pref_notes_chauffeur ? `<div style="background:#111;border-radius:8px;padding:16px 20px;border-left:3px solid #888;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:1px;">Préférences client</p>
      <p style="margin:0;font-size:13px;color:#ccc;">${String((c as Record<string, unknown>).pref_notes_chauffeur)}</p>
    </div>` : ''}
    <p style="margin:0;font-size:13px;color:#888;">Bonne mission !<br><strong style="color:#C9A060;">${entite.nom || 'Direction'}</strong></p>`

  return { subject, html: base(subject, body, entite) }
}

export function buildPaiementEmail({ reservation: r, client: c, entite, lang }: EmailData): { subject: string; html: string } {
  const isFr = lang === 'fr'
  const service = SERVICE_LABELS[r.service as string]?.[lang] ?? String(r.service)
  const subject = isFr
    ? `Confirmation de paiement — ${service}`
    : `Payment confirmation — ${service}`

  const montant = `${(r.montant as number).toLocaleString()} ${r.currency}`

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;">${isFr ? `Bonjour ${c.prenom},` : `Dear ${c.prenom},`}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.6;">
      ${isFr ? 'Nous confirmons la réception de votre paiement.' : 'We confirm the receipt of your payment.'}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      ${infoRow(isFr ? 'Service' : 'Service', service)}
      ${infoRow(isFr ? 'Montant' : 'Amount', montant)}
      ${infoRow(isFr ? 'Mode' : 'Method', r.mode_paiement ? String(r.mode_paiement).replace(/_/g, ' ') : '—')}
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#888;">
      ${isFr ? 'Merci de votre confiance.' : 'Thank you for your trust.'}<br>
      <strong style="color:#C9A060;">${entite.nom || 'L\'équipe'}</strong>
    </p>`

  return { subject, html: base(subject, body, entite) }
}

export type EmailTemplate = 'confirmation' | 'chauffeur_brief' | 'paiement'

export const TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  confirmation: 'Confirmation réservation (client)',
  chauffeur_brief: 'Brief mission (chauffeur)',
  paiement: 'Confirmation paiement (client)',
}

export function buildEmail(template: EmailTemplate, data: EmailData & { chauffeurNom?: string }): { subject: string; html: string } {
  switch (template) {
    case 'confirmation': return buildConfirmationEmail(data)
    case 'chauffeur_brief': return buildChauffeurBriefEmail(data)
    case 'paiement': return buildPaiementEmail(data)
    default: return buildConfirmationEmail(data)
  }
}
