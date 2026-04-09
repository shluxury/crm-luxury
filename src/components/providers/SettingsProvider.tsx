'use client'

import { createContext, useContext } from 'react'
import type { AppSettings, EntiteConfig, Currency } from '@/types/database'

const DEFAULT_SETTINGS: AppSettings = {
  entites: [
    { id: 'entite_1', nom: '', pays: 'France', devise: 'EUR', adresse: '', cp: '', ville: '', tel: '', email: '', siret: '', tva: '', iban: '', actif: true },
    { id: 'entite_2', nom: '', pays: '', devise: 'EUR', adresse: '', cp: '', ville: '', tel: '', email: '', siret: '', tva: '', iban: '', actif: false },
  ],
  email: { brevo_key: '', auto_send_client: false, auto_send_chauffeur: false, lang_defaut: 'fr' },
  integrations: { airlabs_key: '', google_maps_key: '', stripe_secret_key: '', stripe_publishable_key: '' },
  email_templates: {},
  localisation: { lang_crm: 'fr', lang_emails: 'fr', lang_factures: 'fr', devise_defaut: 'EUR', timezone: 'Europe/Paris' },
}

const SettingsContext = createContext<AppSettings>(DEFAULT_SETTINGS)

export function SettingsProvider({ children, settings }: { children: React.ReactNode; settings: AppSettings }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}

// Hooks utilitaires
export function useEntites() {
  const { entites } = useSettings()
  return entites.filter((e) => e.actif)
}

export function useEntiteOptions() {
  return useEntites().map((e) => ({ value: e.id, label: e.nom || e.id }))
}

export function useEntiteLabel(id: string): string {
  const { entites } = useSettings()
  return entites.find((e) => e.id === id)?.nom || id
}

export function useDeviseDefaut(): Currency {
  const entites = useEntites()
  return entites[0]?.devise ?? 'EUR'
}
