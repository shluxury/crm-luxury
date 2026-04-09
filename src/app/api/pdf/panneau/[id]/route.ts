import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import { NextRequest } from 'next/server'

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from('reservations')
    .select('*, client:clients(id, prenom, nom, entreprise, is_corporate, corp_nom)')
    .eq('id', id)
    .single()

  if (error || !raw) {
    return new Response('Réservation introuvable', { status: 404 })
  }

  const r = raw as unknown as Record<string, unknown>
  const client = r.client as Record<string, unknown> | null

  const settings = await getSettings()
  const entite = settings.entites.find((e) => e.id === (r.entite as string)) ?? settings.entites[0]

  const date = r.date
    ? new Date(r.date as string).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const heure = r.heure ? String(r.heure).slice(0, 5) : ''

  // Name to display: corporate name > client name
  const displayName = client?.is_corporate && client?.corp_nom
    ? String(client.corp_nom)
    : client
    ? `${client.prenom} ${client.nom}`
    : 'VIP'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Panneau d'accueil</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fff;
    color: #1a1a1a;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
    text-align: center;
  }
  .company-logo {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 40px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 20px;
    width: 100%;
  }
  .welcome {
    font-size: 18px;
    font-weight: 300;
    color: #aaa;
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .client-name {
    font-size: clamp(48px, 8vw, 96px);
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.05;
    letter-spacing: -1px;
    margin-bottom: 40px;
    word-break: break-word;
  }
  .gold-line {
    width: 80px;
    height: 3px;
    background: #C9A060;
    margin: 0 auto 40px;
  }
  .info-block {
    display: flex;
    gap: 48px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }
  .info-item { text-align: center; }
  .info-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #aaa;
    margin-bottom: 6px;
  }
  .info-value {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .bottom-brand {
    position: fixed;
    bottom: 30px;
    left: 0; right: 0;
    text-align: center;
    font-size: 12px;
    color: #ccc;
    letter-spacing: 2px;
  }
  @media print {
    body { padding: 30px; }
    .no-print { display: none !important; }
    @page { margin: 0; size: A4 landscape; }
  }
</style>
</head>
<body>

<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:10;">
  <button onclick="window.print()" style="background:#1a1a1a;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Imprimer PDF (A4 paysage)</button>
</div>

<div class="company-logo">${esc(entite?.nom || '')}</div>

<div class="welcome">Bienvenue</div>
<div class="client-name">${esc(displayName)}</div>
<div class="gold-line"></div>

<div class="info-block">
  ${date ? `
  <div class="info-item">
    <div class="info-label">Date</div>
    <div class="info-value">${esc(date)}</div>
  </div>` : ''}
  ${heure ? `
  <div class="info-item">
    <div class="info-label">Heure de prise en charge</div>
    <div class="info-value">${esc(heure)}</div>
  </div>` : ''}
  ${r.num_vol ? `
  <div class="info-item">
    <div class="info-label">Vol</div>
    <div class="info-value">${esc(r.num_vol)}</div>
  </div>` : ''}
  ${r.destination ? `
  <div class="info-item">
    <div class="info-label">Destination</div>
    <div class="info-value">${esc(r.destination)}</div>
  </div>` : ''}
</div>

<div class="bottom-brand">${esc(entite?.nom || '')} · Service Premium</div>

</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
