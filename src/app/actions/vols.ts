'use server'

import { getSettings } from '@/app/actions/settings'
import { createClient } from '@/lib/supabase/server'

export interface FlightInfo {
  flight_iata: string
  airline_iata: string
  dep_iata: string
  arr_iata: string
  dep_time: string | null
  arr_time: string | null
  dep_estimated: string | null
  arr_estimated: string | null
  dep_actual: string | null
  arr_actual: string | null
  dep_delayed: number | null
  arr_delayed: number | null
  dep_terminal: string | null
  dep_gate: string | null
  arr_terminal: string | null
  arr_gate: string | null
  status: string | null
  duration: number | null
}

export async function lookupFlightAction(flightIata: string): Promise<{ data?: FlightInfo; error?: string }> {
  if (!flightIata?.trim()) return { error: 'Numéro de vol requis' }

  const settings = await getSettings()
  const apiKey = settings.integrations.airlabs_key
  if (!apiKey) return { error: 'Clé API Airlabs non configurée (Paramètres > Intégrations)' }

  const code = flightIata.trim().toUpperCase()

  try {
    const res = await fetch(
      `https://airlabs.co/api/v9/schedules?flight_iata=${encodeURIComponent(code)}&api_key=${apiKey}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return { error: `Erreur API Airlabs: ${res.status}` }

    const json = await res.json() as { response?: FlightInfo[]; error?: { message: string } }
    if (json.error) return { error: json.error.message }
    if (!json.response || json.response.length === 0) return { error: `Vol ${code} introuvable` }

    return { data: json.response[0] }
  } catch (e) {
    return { error: `Erreur réseau: ${String(e)}` }
  }
}

export interface FlightAlert {
  reservation_id: string
  num_vol: string
  client_nom: string
  date_resa: string
  heure_resa: string
  flight: FlightInfo | null
  alert: string | null
}

export async function getFlightAlertsAction(): Promise<{ data?: FlightAlert[]; error?: string }> {
  const settings = await getSettings()
  const apiKey = settings.integrations.airlabs_key
  if (!apiKey) return { data: [] }

  const supabase = await createClient()

  // Récupère les réservations des 24 prochaines heures avec un num_vol
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: resas, error } = await supabase
    .from('reservations')
    .select('id, num_vol, date, heure, client:clients(prenom, nom), flight_info')
    .not('num_vol', 'is', null)
    .neq('num_vol', '')
    .neq('statut', 'cancelled')
    .gte('date', todayStr)
    .lte('date', tomorrowStr)

  if (error) return { error: error.message }
  if (!resas || resas.length === 0) return { data: [] }

  const alerts: FlightAlert[] = []

  for (const r of resas) {
    const resa = r as unknown as Record<string, unknown>
    const client = resa.client as Record<string, string> | null
    const numVol = resa.num_vol as string

    // Cherche infos vol
    let flight: FlightInfo | null = null
    let alertMsg: string | null = null

    try {
      const res = await fetch(
        `https://airlabs.co/api/v9/schedules?flight_iata=${encodeURIComponent(numVol)}&api_key=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const json = await res.json() as { response?: FlightInfo[] }
        if (json.response && json.response.length > 0) {
          flight = json.response[0]

          // Génère alerte si retard ou annulation
          if (flight.status === 'cancelled') {
            alertMsg = `Vol annulé`
          } else if (flight.dep_delayed && flight.dep_delayed > 15) {
            alertMsg = `Retard départ ${flight.dep_delayed} min`
          } else if (flight.arr_delayed && flight.arr_delayed > 15) {
            alertMsg = `Retard arrivée ${flight.arr_delayed} min`
          }
        }
      }
    } catch {
      // Continue sans alerte si erreur réseau
    }

    alerts.push({
      reservation_id: resa.id as string,
      num_vol: numVol,
      client_nom: client ? `${client.prenom} ${client.nom}` : '-',
      date_resa: resa.date as string,
      heure_resa: resa.heure as string,
      flight,
      alert: alertMsg,
    })
  }

  return { data: alerts }
}
