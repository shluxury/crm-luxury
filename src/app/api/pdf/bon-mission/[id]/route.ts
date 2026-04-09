import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import { NextRequest } from 'next/server'

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const SERVICE_LABELS: Record<string, string> = {
  transfert_aeroport: 'Transfert aéroport',
  transfert_simple: 'Transfert',
  mise_a_disposition: 'Mise à disposition',
  helicoptere: 'Hélicoptère',
  jet_prive: 'Jet privé',
  restaurant: 'Réservation restaurant',
  location_voiture: 'Location véhicule',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: raw, error } = await supabase
    .from('reservations')
    .select('*, client:clients(id, prenom, nom, tel, email, langue, pref_vehicule, pref_notes_chauffeur), chauffeur:chauffeurs(id, nom, tel), partenaire:partenaires(id, nom, tel)')
    .eq('id', id)
    .single()

  if (error || !raw) {
    return new Response('Réservation introuvable', { status: 404 })
  }

  const r = raw as unknown as Record<string, unknown>
  const client = r.client as Record<string, unknown> | null
  const chauffeur = r.chauffeur as Record<string, unknown> | null
  const partenaire = r.partenaire as Record<string, unknown> | null

  const settings = await getSettings()
  const entite = settings.entites.find((e) => e.id === (r.entite as string)) ?? settings.entites[0]

  const date = r.date
    ? new Date(r.date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const heure = r.heure ? String(r.heure).slice(0, 5) : ''
  const service = SERVICE_LABELS[r.service as string] ?? String(r.service ?? '')

  const stops = (r.stops as string[]) ?? []
  const extras = (r.extras as { desc: string; qty: number; price: number; type: string }[]) ?? []
  const extrasTotal = extras.reduce((s, e) => s + e.qty * e.price, 0)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bon de mission</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; padding: 32px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #1a1a1a; }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
  .brand-sub { font-size: 11px; color: #888; margin-top: 3px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 22px; font-weight: 300; color: #555; letter-spacing: 2px; text-transform: uppercase; }
  .doc-title .ref { font-size: 12px; color: #aaa; margin-top: 4px; }
  .mission-banner { background: #1a1a1a; color: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; }
  .mission-service { font-size: 18px; font-weight: 700; }
  .mission-date { font-size: 14px; color: #ccc; margin-top: 4px; }
  .mission-time { text-align: right; }
  .mission-time .time-val { font-size: 32px; font-weight: 800; color: #C9A060; line-height: 1; }
  .mission-time .time-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .section { background: #f9f9f9; border-radius: 8px; padding: 14px 16px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #888; }
  .info-value { font-weight: 500; color: #1a1a1a; text-align: right; max-width: 60%; }
  .trajet-section { background: #f9f9f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
  .trajet-point { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; }
  .trajet-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
  .dot-depart { background: #4CAF50; }
  .dot-stop { background: #FF9800; }
  .dot-arrivee { background: #F44336; }
  .trajet-line { width: 1px; height: 16px; background: #ddd; margin-left: 4px; }
  .trajet-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .trajet-addr { font-size: 13px; font-weight: 500; color: #1a1a1a; }
  .notes-section { border: 2px solid #C9A060; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
  .notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #C9A060; margin-bottom: 6px; }
  .notes-text { font-size: 13px; color: #333; line-height: 1.6; white-space: pre-wrap; }
  .extras-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 12px; }
  .extras-table th { text-align: left; padding: 6px 8px; background: #f0f0f0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .extras-table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
  .signature-box { border: 1.5px dashed #ccc; border-radius: 8px; padding: 16px; min-height: 80px; }
  .signature-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
  .footer { text-align: center; font-size: 10px; color: #ccc; border-top: 1px solid #eee; padding-top: 14px; margin-top: 24px; }
  @media print {
    body { padding: 16px; }
    .no-print { display: none !important; }
    @page { margin: 1cm; size: A4 portrait; }
  }
</style>
</head>
<body>

<div class="no-print" style="background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
  <span>Bon de mission — Chauffeur</span>
  <button onclick="window.print()" style="background:#C9A060;color:#000;border:none;padding:7px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;">Imprimer PDF</button>
</div>

<div class="header">
  <div>
    <div class="brand">${esc(entite?.nom || '')}</div>
    <div class="brand-sub">${esc(entite?.email || '')} ${entite?.tel ? '· ' + esc(entite.tel) : ''}</div>
  </div>
  <div class="doc-title">
    <h1>Bon de mission</h1>
    <div class="ref">Réf. ${esc(r.id as string).slice(0, 8).toUpperCase()}</div>
  </div>
</div>

<div class="mission-banner">
  <div>
    <div class="mission-service">${esc(service)}</div>
    <div class="mission-date">${esc(date)}</div>
  </div>
  <div class="mission-time">
    <div class="time-val">${esc(heure)}</div>
    <div class="time-label">Heure de prise en charge</div>
  </div>
</div>

<div class="grid-2">
  <div class="section">
    <div class="section-title">Client</div>
    ${client ? `
    <div class="info-row"><span class="info-label">Nom</span><span class="info-value">${esc(client.prenom)} ${esc(client.nom)}</span></div>
    ${client.tel ? `<div class="info-row"><span class="info-label">Téléphone</span><span class="info-value">${esc(client.tel)}</span></div>` : ''}
    ${client.langue ? `<div class="info-row"><span class="info-label">Langue</span><span class="info-value">${esc(client.langue)}</span></div>` : ''}
    ${r.pax ? `<div class="info-row"><span class="info-label">Passagers</span><span class="info-value">${esc(r.pax)}</span></div>` : ''}
    ${r.bagages ? `<div class="info-row"><span class="info-label">Bagages</span><span class="info-value">${esc(r.bagages)}</span></div>` : ''}
    ` : '<span style="color:#aaa;font-size:12px;">Non renseigné</span>'}
  </div>

  <div class="section">
    <div class="section-title">Mission</div>
    ${r.vehicule ? `<div class="info-row"><span class="info-label">Véhicule</span><span class="info-value">${esc(r.vehicule)}</span></div>` : ''}
    ${r.num_vol ? `<div class="info-row"><span class="info-label">Vol</span><span class="info-value">${esc(r.num_vol)}</span></div>` : ''}
    ${r.nb_heures ? `<div class="info-row"><span class="info-label">Durée</span><span class="info-value">${esc(r.nb_heures)}h</span></div>` : ''}
    ${r.wait_hours ? `<div class="info-row"><span class="info-label">Attente</span><span class="info-value">${esc(r.wait_hours)}h</span></div>` : ''}
    ${r.ref_partenaire ? `<div class="info-row"><span class="info-label">Réf. partenaire</span><span class="info-value">${esc(r.ref_partenaire)}</span></div>` : ''}
    ${partenaire ? `<div class="info-row"><span class="info-label">Sous-traitant</span><span class="info-value">${esc(partenaire.nom)}</span></div>` : ''}
  </div>
</div>

${(r.depart || r.destination || stops.length > 0) ? `
<div class="trajet-section">
  <div class="section-title">Trajet</div>
  ${r.depart ? `
  <div class="trajet-point">
    <span class="trajet-dot dot-depart"></span>
    <div><div class="trajet-label">Départ</div><div class="trajet-addr">${esc(r.depart)}</div></div>
  </div>
  ` : ''}
  ${stops.map((s: string) => `
  <div class="trajet-point">
    <span class="trajet-dot dot-stop"></span>
    <div><div class="trajet-label">Arrêt</div><div class="trajet-addr">${esc(s)}</div></div>
  </div>
  `).join('')}
  ${r.destination ? `
  <div class="trajet-point">
    <span class="trajet-dot dot-arrivee"></span>
    <div><div class="trajet-label">Destination</div><div class="trajet-addr">${esc(r.destination)}</div></div>
  </div>
  ` : ''}
</div>
` : ''}

${r.mad_itinerary ? `
<div class="section" style="margin-bottom:16px;">
  <div class="section-title">Programme de la journée</div>
  <div style="font-size:12px;color:#333;line-height:1.7;white-space:pre-wrap;">${esc(r.mad_itinerary)}</div>
</div>
` : ''}

${extras.length > 0 ? `
<div class="section" style="margin-bottom:16px;">
  <div class="section-title">Extras</div>
  <table class="extras-table">
    <thead><tr><th>Description</th><th>Qté</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>
      ${extras.map((e) => `<tr><td>${esc(e.desc)}</td><td>${e.qty}</td><td style="text-align:right">${(e.qty * e.price).toLocaleString()} ${esc(r.currency)}</td></tr>`).join('')}
      ${extrasTotal > 0 ? `<tr style="font-weight:700"><td colspan="2">Total extras</td><td style="text-align:right">${extrasTotal.toLocaleString()} ${esc(r.currency)}</td></tr>` : ''}
    </tbody>
  </table>
</div>
` : ''}

${client?.pref_notes_chauffeur ? `
<div class="notes-section">
  <div class="notes-title">Préférences client (chauffeur)</div>
  <div class="notes-text">${esc(client.pref_notes_chauffeur)}</div>
</div>
` : ''}

${r.notes ? `
<div class="notes-section">
  <div class="notes-title">Notes de mission</div>
  <div class="notes-text">${esc(r.notes)}</div>
</div>
` : ''}

${chauffeur ? `
<div class="section" style="margin-bottom:16px;background:#eaf4ea;">
  <div class="section-title" style="color:#4CAF50;">Chauffeur assigné</div>
  <div class="info-row"><span class="info-label">Nom</span><span class="info-value">${esc(chauffeur.nom)}</span></div>
  ${chauffeur.tel ? `<div class="info-row"><span class="info-label">Tél.</span><span class="info-value">${esc(chauffeur.tel)}</span></div>` : ''}
</div>
` : ''}

<div class="signature-grid">
  <div class="signature-box">
    <div class="signature-label">Signature chauffeur</div>
  </div>
  <div class="signature-box">
    <div class="signature-label">Signature client / Accusé réception</div>
  </div>
</div>

<div class="footer">
  ${esc(entite?.nom || '')} ${entite?.siret ? '· SIRET ' + esc(entite.siret) : ''}
  — Document confidentiel — Usage interne
</div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
