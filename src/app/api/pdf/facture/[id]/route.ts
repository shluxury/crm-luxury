import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import { NextRequest } from 'next/server'

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: factureRaw, error } = await supabase
    .from('factures')
    .select('*, client:clients(*), reservation:reservations(service, date, depart, destination, num_vol, vehicule, pax, nb_heures, resto, notes)')
    .eq('id', id)
    .single()

  if (error || !factureRaw) {
    return new Response('Facture introuvable', { status: 404 })
  }
  const facture = factureRaw as unknown as Record<string, unknown>

  const settings = await getSettings()
  const entite = settings.entites.find((e) => e.id === (facture.entite as string)) ?? settings.entites[0]
  const client = facture.client as Record<string, unknown>
  const reservation = facture.reservation as Record<string, unknown> | null

  const SERVICE_LABELS: Record<string, string> = {
    transfert_aeroport: 'Transfert aéroport',
    transfert_simple: 'Transfert',
    mise_a_disposition: 'Mise à disposition',
    helicoptere: 'Hélicoptère',
    jet_prive: 'Jet privé',
    restaurant: 'Réservation restaurant',
    location_voiture: 'Location véhicule',
  }

  const PAYMENT_LABELS: Record<string, string> = {
    sumup: 'SumUp',
    stripe: 'Stripe',
    tpe: 'TPE',
    virement_fr: 'Virement bancaire',
    virement_dubai: 'Virement bancaire international',
    especes: 'Espèces',
    currenxie_us_usd: 'Currenxie US/USD',
    currenxie_uk_eur: 'Currenxie UK/EUR',
    currenxie_hk_hkd: 'Currenxie HK/HKD',
    currenxie_hk_eur: 'Currenxie HK/EUR',
  }

  const dateFacture = new Date(facture.created_at as string).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const montant = (facture.montant as number) ?? 0
  const currency = facture.currency ?? 'EUR'

  const descriptionLines: string[] = []
  if (reservation) {
    const service = SERVICE_LABELS[reservation.service as string] ?? String(reservation.service ?? '')
    const date = reservation.date
      ? new Date(reservation.date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    descriptionLines.push(`${service}${date ? ' — ' + date : ''}`)
    if (reservation.depart) descriptionLines.push(`Départ : ${reservation.depart}`)
    if (reservation.destination) descriptionLines.push(`Destination : ${reservation.destination}`)
    if (reservation.num_vol) descriptionLines.push(`Vol : ${reservation.num_vol}`)
    if (reservation.vehicule) descriptionLines.push(`Véhicule : ${reservation.vehicule}`)
    if (reservation.pax && (reservation.pax as number) > 0) descriptionLines.push(`Passagers : ${reservation.pax}`)
    if (reservation.nb_heures) descriptionLines.push(`Durée : ${reservation.nb_heures}h`)
    if (reservation.resto) descriptionLines.push(`Restaurant : ${reservation.resto}`)
    if (reservation.notes) descriptionLines.push(`Notes : ${reservation.notes}`)
  }

  const clientAddress = [
    client.is_corporate && client.corp_nom ? `<strong>${esc(client.corp_nom)}</strong><br>` : '',
    client.is_corporate && client.corp_adresse ? `${esc(client.corp_adresse)}<br>` : '',
    client.is_corporate && (client.corp_cp || client.corp_ville)
      ? `${esc(client.corp_cp)} ${esc(client.corp_ville)}<br>` : '',
    client.is_corporate && client.corp_tva ? `TVA : ${esc(client.corp_tva)}<br>` : '',
    client.is_corporate && client.corp_siret ? `SIRET : ${esc(client.corp_siret)}<br>` : '',
  ].filter(Boolean).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${esc(facture.numero)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; padding: 40px; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; }
  .brand-name { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
  .brand-info { font-size: 12px; color: #666; line-height: 1.8; margin-top: 6px; }
  .invoice-title { font-size: 28px; font-weight: 300; color: #888; text-align: right; }
  .invoice-num { font-size: 20px; font-weight: 700; color: #1a1a1a; text-align: right; }
  .invoice-date { font-size: 12px; color: #888; text-align: right; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
  .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .party-info { font-size: 12px; color: #555; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #1a1a1a; color: #fff; padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  tbody td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .total-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .total-box { width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; border-bottom: 1px solid #eee; }
  .total-final { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .payment-info { background: #f8f8f8; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; }
  .payment-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
  .payment-method { font-size: 13px; color: #1a1a1a; }
  ${entite.iban ? `.iban { font-family: monospace; font-size: 12px; color: #333; margin-top: 4px; }` : ''}
  .footer { text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>
<div class="no-print" style="background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
  <span>Aperçu facture — ${esc(facture.numero)}</span>
  <button onclick="window.print()" style="background:#C9A060;color:#000;border:none;padding:8px 20px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Imprimer / Sauvegarder PDF</button>
</div>

<div class="header">
  <div>
    <div class="brand-name">${esc(entite.nom || 'Société')}</div>
    <div class="brand-info">
      ${entite.adresse ? esc(entite.adresse) + '<br>' : ''}
      ${(entite.cp || entite.ville) ? `${esc(entite.cp)} ${esc(entite.ville)}<br>` : ''}
      ${entite.pays ? esc(entite.pays) + '<br>' : ''}
      ${entite.tel ? esc(entite.tel) + '<br>' : ''}
      ${entite.email ? esc(entite.email) + '<br>' : ''}
      ${entite.siret ? 'SIRET : ' + esc(entite.siret) + '<br>' : ''}
      ${entite.tva ? 'TVA : ' + esc(entite.tva) : ''}
    </div>
  </div>
  <div>
    <div class="invoice-title">FACTURE</div>
    <div class="invoice-num">${esc(facture.numero)}</div>
    <div class="invoice-date">Émise le ${dateFacture}</div>
  </div>
</div>

<div class="parties">
  <div>
    <div class="party-label">Émetteur</div>
    <div class="party-name">${esc(entite.nom)}</div>
    <div class="party-info">
      ${entite.adresse ? esc(entite.adresse) + '<br>' : ''}
      ${(entite.cp || entite.ville) ? `${esc(entite.cp)} ${esc(entite.ville)}` : ''}
    </div>
  </div>
  <div>
    <div class="party-label">Destinataire</div>
    <div class="party-name">${esc(client.prenom)} ${esc(client.nom)}</div>
    <div class="party-info">
      ${clientAddress || (client.email ? esc(client.email) : '')}
      ${!client.is_corporate && client.tel ? '<br>' + esc(client.tel) : ''}
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:60%">Description</th>
      <th style="text-align:right">Montant</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        ${descriptionLines.length > 0
          ? descriptionLines.map((l) => esc(l)).join('<br><span style="color:#888;font-size:12px;">')
            + (descriptionLines.length > 1 ? '</span>'.repeat(descriptionLines.length - 1) : '')
          : `Prestation — ${esc(facture.numero)}`}
      </td>
      <td style="text-align:right;font-weight:600;font-size:15px;">${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${esc(currency)}</td>
    </tr>
  </tbody>
</table>

<div class="total-section">
  <div class="total-box">
    <div class="total-row">
      <span>Sous-total HT</span>
      <span>${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${esc(currency)}</span>
    </div>
    <div class="total-row">
      <span>TVA (0%)</span>
      <span>0,00 ${esc(currency)}</span>
    </div>
    <div class="total-final">
      <span>TOTAL TTC</span>
      <span>${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${esc(currency)}</span>
    </div>
  </div>
</div>

${facture.mode_paiement || entite.iban ? `
<div class="payment-info">
  <div class="payment-title">Informations de paiement</div>
  ${facture.mode_paiement ? `<div class="payment-method">Mode : ${PAYMENT_LABELS[facture.mode_paiement as string] ?? facture.mode_paiement}</div>` : ''}
  ${entite.iban ? `<div class="iban">IBAN : ${esc(entite.iban)}</div>` : ''}
</div>` : ''}

${facture.notes ? `<div style="background:#f8f8f8;border-radius:8px;padding:16px 20px;margin-bottom:32px;border-left:3px solid #C9A060;">
  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:6px;">Notes</div>
  <div style="font-size:13px;color:#555;">${esc(facture.notes)}</div>
</div>` : ''}

<div class="footer">
  ${esc(entite.nom || '')} ${entite.siret ? '· SIRET ' + esc(entite.siret) : ''} ${entite.tva ? '· TVA ' + esc(entite.tva) : ''}
</div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
