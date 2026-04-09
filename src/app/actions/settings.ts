'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import type { AppSettings, EntiteConfig, Currency } from '@/types/database'

const ALLOWED_SETTING_KEYS = ['entites', 'email', 'integrations', 'email_templates', 'localisation'] as const
type AllowedKey = typeof ALLOWED_SETTING_KEYS[number]

const DEFAULT_SETTINGS: AppSettings = {
  entites: [
    { id: 'entite_1', nom: '', pays: '', devise: 'EUR', adresse: '', cp: '', ville: '', tel: '', email: '', siret: '', tva: '', iban: '', actif: true },
    { id: 'entite_2', nom: '', pays: '', devise: 'EUR', adresse: '', cp: '', ville: '', tel: '', email: '', siret: '', tva: '', iban: '', actif: false },
  ],
  email: { brevo_key: '', auto_send_client: false, auto_send_chauffeur: false, lang_defaut: 'fr' },
  integrations: { airlabs_key: '', google_maps_key: '', stripe_secret_key: '', stripe_publishable_key: '' },
  email_templates: {
    global: {
      confirmation: {},
      paiement: {},
      rappel: {},
      chauffeur_brief: {},
      facture: {},
      stripe_link: {},
      bon_mission: {},
      devis: {},
      postservice: {},
    },
    concierge: {
      helico_confirmation: {},
      helico_devis: {},
      helico_paiement: {},
      jet_confirmation: {},
      jet_devis: {},
      jet_paiement: {},
      resto_confirmation: {},
      resto_devis: {},
      resto_paiement: {},
      car_confirmation: {},
      car_devis: {},
      car_paiement: {},
    },
  },
  localisation: { lang_crm: 'fr', lang_emails: 'fr', lang_factures: 'fr', devise_defaut: 'EUR', timezone: 'Europe/Paris' },
}

export async function getSettings(): Promise<AppSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('cle, valeur')

  if (!data || data.length === 0) return DEFAULT_SETTINGS

  const map: Record<string, unknown> = {}
  for (const row of data) map[row.cle] = row.valeur

  return {
    entites: (map.entites as EntiteConfig[]) ?? DEFAULT_SETTINGS.entites,
    email: (map.email as AppSettings['email']) ?? DEFAULT_SETTINGS.email,
    integrations: (map.integrations as AppSettings['integrations']) ?? DEFAULT_SETTINGS.integrations,
    email_templates: (map.email_templates as AppSettings['email_templates']) ?? DEFAULT_SETTINGS.email_templates,
    localisation: (map.localisation as AppSettings['localisation']) ?? DEFAULT_SETTINGS.localisation,
  }
}

export async function updateSettingAction(cle: string, valeur: unknown) {
  try { await requireAuth() } catch { return { error: 'Non authentifié' } }
  if (!(ALLOWED_SETTING_KEYS as readonly string[]).includes(cle)) return { error: 'Clé de paramètre invalide' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ cle: cle as AllowedKey, valeur: valeur as import('@/types/database').Json }, { onConflict: 'cle' })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

