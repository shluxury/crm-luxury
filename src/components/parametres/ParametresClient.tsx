'use client'

import { useState } from 'react'
import { Building2, Plug, Mail, Eye, EyeOff, CheckCircle, FileText, Globe, Palette } from 'lucide-react'
import { updateSettingAction } from '@/app/actions/settings'
import type { AppSettings, EntiteConfig, Currency } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmailTemplatesTab from './EmailTemplatesTab'
import { useTheme } from '@/components/providers/ThemeProvider'

const TABS = [
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'entites', label: 'Entités', icon: Building2 },
  { id: 'localisation', label: 'Localisation', icon: Globe },
  { id: 'integrations', label: 'Intégrations', icon: Plug },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'templates', label: 'Modèles email', icon: FileText },
] as const

type TabId = typeof TABS[number]['id']

const ACCENT_COLORS = [
  { value: '#C9A060', name: 'Or' },
  { value: '#A8A8A8', name: 'Argent' },
  { value: '#4A7FA5', name: 'Bleu marine' },
  { value: '#2E7D52', name: 'Vert' },
  { value: '#8B5A8B', name: 'Mauve' },
  { value: '#C0392B', name: 'Rouge' },
]

interface ParametresClientProps {
  settings: AppSettings
}

// --- Entité Form ---
function EntiteForm({ entite, index, onChange }: { entite: EntiteConfig; index: number; onChange: (e: EntiteConfig) => void }) {
  const set = (field: keyof EntiteConfig, value: unknown) => onChange({ ...entite, [field]: value })
  return (
    <div className={`rounded-xl border p-4 space-y-4 transition ${entite.actif ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-800 bg-neutral-950 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {entite.nom ? entite.nom : `Entité ${index + 1}`}
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400">
          <div className="relative">
            <input type="checkbox" checked={entite.actif} onChange={(e) => set('actif', e.target.checked)} className="sr-only" />
            <div className={`h-5 w-9 rounded-full transition ${entite.actif ? 'bg-[#C9A060]' : 'bg-neutral-700'}`} />
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${entite.actif ? 'left-4' : 'left-0.5'}`} />
          </div>
          Actif
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Nom de la société *" value={entite.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Ma Société SAS" className="col-span-2" />
        <Input label="Pays" value={entite.pays} onChange={(e) => set('pays', e.target.value)} placeholder="France" />
        <Select label="Devise principale" value={entite.devise} onChange={(e) => set('devise', e.target.value as Currency)}
          options={[{ value: 'EUR', label: 'EUR €' }, { value: 'USD', label: 'USD $' }, { value: 'AED', label: 'AED د.إ' }, { value: 'GBP', label: 'GBP £' }]} />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Coordonnées</p>
        <Input label="Adresse" value={entite.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="12 rue de la Paix" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Code postal" value={entite.cp} onChange={(e) => set('cp', e.target.value)} placeholder="75001" />
          <Input label="Ville" value={entite.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Paris" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Téléphone" value={entite.tel} onChange={(e) => set('tel', e.target.value)} placeholder="+33 1 00 00 00 00" />
          <Input label="Email" type="email" value={entite.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@societe.fr" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Informations fiscales</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="SIRET / Équivalent" value={entite.siret} onChange={(e) => set('siret', e.target.value)} placeholder="123 456 789 00010" />
          <Input label="N° TVA / VAT" value={entite.tva} onChange={(e) => set('tva', e.target.value)} placeholder="FR00 000 000 000" />
        </div>
        <Input label="IBAN" value={entite.iban} onChange={(e) => set('iban', e.target.value)} placeholder="FR76 0000 0000 0000 0000 0000 000" />
      </div>
    </div>
  )
}

// --- Champ clé API masquée ---
function ApiKeyInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••••••••••••••••••'}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-8 text-neutral-500 hover:text-neutral-300 transition"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// --- Composant principal ---
export default function ParametresClient({ settings }: ParametresClientProps) {
  const [tab, setTab] = useState<TabId>('apparence')
  const { theme, toggleTheme } = useTheme()
  const [accentColor, setAccentColor] = useState('#C9A060')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Entités state
  const [entites, setEntites] = useState<EntiteConfig[]>(settings.entites)

  // Localisation state
  const [localisation, setLocalisation] = useState(settings.localisation)
  const setLoc = (k: keyof typeof localisation, v: string) => setLocalisation((p) => ({ ...p, [k]: v }))

  // Intégrations state
  const [integrations, setIntegrations] = useState(settings.integrations)
  const setInteg = (k: keyof typeof integrations, v: string) => setIntegrations((p) => ({ ...p, [k]: v }))

  // Email state
  const [emailConfig, setEmailConfig] = useState(settings.email)
  const setEmail = (k: keyof typeof emailConfig, v: unknown) => setEmailConfig((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    let result: { error?: string; success?: boolean } = {}

    if (tab === 'entites') result = await updateSettingAction('entites', entites)
    else if (tab === 'localisation') result = await updateSettingAction('localisation', localisation)
    else if (tab === 'integrations') result = await updateSettingAction('integrations', integrations)
    else if (tab === 'emails') result = await updateSettingAction('email', emailConfig)

    setSaving(false)
    if (!result.error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const isTemplateTab = tab === 'templates'
  const isApparenceTab = tab === 'apparence'

  function applyAccent(color: string) {
    setAccentColor(color)
    document.documentElement.style.setProperty('--gold', color)
    localStorage.setItem('crm-accent', color)
  }

  return (
    <div className={isTemplateTab ? 'max-w-5xl' : 'max-w-2xl'}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Paramètres</h1>
        <p className="mt-0.5 text-sm text-neutral-400">Configuration de votre CRM</p>
      </div>

      {/* Onglets */}
      <div className="mb-6 flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); setSaved(false) }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-300'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      <div className="space-y-4">

        {tab === 'apparence' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-6">
            {/* Thème */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">Thème</p>
              <div className="flex gap-3">
                {/* Carte Dark */}
                <button
                  onClick={() => { if (theme === 'light') toggleTheme() }}
                  className="flex-shrink-0 rounded-xl overflow-hidden transition"
                  style={{
                    border: theme === 'dark' ? '2px solid #C9A060' : '2px solid transparent',
                    width: 130,
                    outline: 'none',
                  }}
                >
                  <div className="h-16 flex items-center justify-center gap-2" style={{ background: '#0F0F0F' }}>
                    <div className="w-5 h-5 rounded-full bg-[#C9A060]" />
                    <div className="w-10 h-2 rounded bg-[#C9A060] opacity-70" />
                  </div>
                  <div className="p-2 flex justify-between items-center" style={{ background: '#1A1A1A' }}>
                    <span className="text-xs font-medium text-neutral-200">Nuit</span>
                    {theme === 'dark' && <span className="text-[#C9A060] text-xs">✓</span>}
                  </div>
                </button>
                {/* Carte Light */}
                <button
                  onClick={() => { if (theme === 'dark') toggleTheme() }}
                  className="flex-shrink-0 rounded-xl overflow-hidden transition"
                  style={{
                    border: theme === 'light' ? '2px solid #C9A060' : '2px solid transparent',
                    width: 130,
                    outline: 'none',
                  }}
                >
                  <div className="h-16 flex items-center justify-center gap-2" style={{ background: '#F5F3EF' }}>
                    <div className="w-5 h-5 rounded-full bg-[#C9A060]" />
                    <div className="w-10 h-2 rounded bg-[#C9A060] opacity-70" />
                  </div>
                  <div className="p-2 flex justify-between items-center" style={{ background: '#FFFFFF' }}>
                    <span className="text-xs font-medium text-neutral-800">Jour</span>
                    {theme === 'light' && <span className="text-[#C9A060] text-xs">✓</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Couleur d'accent */}
            <div className="pt-4 border-t border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">Couleur d&apos;accent</p>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map(({ value, name }) => (
                  <button
                    key={value}
                    onClick={() => applyAccent(value)}
                    title={name}
                    className="rounded-lg transition hover:scale-110"
                    style={{
                      width: 40, height: 40,
                      background: value,
                      border: accentColor === value ? '3px solid white' : '3px solid transparent',
                      boxShadow: accentColor === value ? `0 0 0 2px ${value}` : 'none',
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-600">L&apos;accent or (#C9A060) est la valeur recommandée pour un rendu premium.</p>
            </div>
          </div>
        )}

        {tab === 'entites' && (
          <>
            <p className="text-xs text-neutral-500">Configurez les sociétés qui émettent les réservations et factures. Les entités actives apparaissent dans tous les formulaires.</p>
            {entites.map((entite, idx) => (
              <EntiteForm
                key={entite.id}
                entite={entite}
                index={idx}
                onChange={(updated) => setEntites((prev) => prev.map((e) => e.id === updated.id ? updated : e))}
              />
            ))}
          </>
        )}

        {tab === 'localisation' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
            <p className="text-xs text-neutral-500">Paramètres de langue et de région utilisés dans le CRM, les emails et les factures.</p>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Langue du CRM" value={localisation.lang_crm} onChange={(e) => setLoc('lang_crm', e.target.value)}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
              <Select label="Langue des emails clients" value={localisation.lang_emails} onChange={(e) => setLoc('lang_emails', e.target.value)}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
              <Select label="Langue des factures" value={localisation.lang_factures} onChange={(e) => setLoc('lang_factures', e.target.value)}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
              <Select label="Devise par défaut" value={localisation.devise_defaut} onChange={(e) => setLoc('devise_defaut', e.target.value)}
                options={[
                  { value: 'EUR', label: '€ Euro (EUR)' },
                  { value: 'AED', label: 'د.إ Dirham (AED)' },
                  { value: 'USD', label: '$ Dollar (USD)' },
                  { value: 'GBP', label: '£ Sterling (GBP)' },
                ]} />
              <Select label="Fuseau horaire" value={localisation.timezone} onChange={(e) => setLoc('timezone', e.target.value)}
                options={[
                  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
                  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
                  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
                  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
                ]} />
            </div>
          </div>
        )}

        {tab === 'integrations' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Airlabs</p>
              <p className="text-xs text-neutral-500">
                Lookup de vol en temps réel — statut, retards, terminal, porte (500 req/mois gratuit)
              </p>
              <ApiKeyInput
                label="Clé API Airlabs"
                value={integrations.airlabs_key}
                onChange={(v) => setInteg('airlabs_key', v)}
                placeholder="Clé API Airlabs"
              />
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-1">
              <p className="text-sm font-medium text-white">Google Maps</p>
              <p className="text-xs text-neutral-500">Autocomplétion des adresses dans les formulaires</p>
              <Input label="Clé API Google Maps (publique)" value={integrations.google_maps_key} onChange={(e) => setInteg('google_maps_key', e.target.value)} placeholder="AIzaSy..." />
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-white">Stripe</p>
              <p className="text-xs text-neutral-500">Génération de liens de paiement Stripe Checkout</p>
              <Input label="Clé publique (publishable)" value={integrations.stripe_publishable_key} onChange={(e) => setInteg('stripe_publishable_key', e.target.value)} placeholder="pk_live_..." />
              <ApiKeyInput label="Clé secrète (secret)" value={integrations.stripe_secret_key} onChange={(v) => setInteg('stripe_secret_key', v)} placeholder="sk_live_..." />
            </div>
          </div>
        )}

        {tab === 'emails' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Brevo (SendinBlue)</p>
              <p className="text-xs text-neutral-500">Envoi d'emails transactionnels (confirmations, factures, lien de paiement)</p>
              <ApiKeyInput label="Clé API Brevo" value={emailConfig.brevo_key} onChange={(v) => setEmail('brevo_key', v)} />
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-1">
              <p className="text-sm font-medium text-white">Langue par défaut</p>
              <Select label="" value={emailConfig.lang_defaut} onChange={(e) => setEmail('lang_defaut', e.target.value)}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-white">Envois automatiques</p>
              {[
                { key: 'auto_send_client' as const, label: 'Confirmation automatique au client', desc: 'Envoyer un email de confirmation dès qu\'une réservation est créée' },
                { key: 'auto_send_chauffeur' as const, label: 'Briefing automatique au chauffeur', desc: 'Envoyer le détail de la mission au chauffeur assigné' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3">
                  <div className="relative mt-0.5 shrink-0">
                    <input type="checkbox" checked={emailConfig[key]} onChange={(e) => setEmail(key, e.target.checked)} className="sr-only" />
                    <div className={`h-5 w-9 rounded-full transition ${emailConfig[key] ? 'bg-[#C9A060]' : 'bg-neutral-700'}`} />
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${emailConfig[key] ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <EmailTemplatesTab settings={settings} />
          </div>
        )}

        {/* Bouton sauvegarde — masqué sur les onglets templates et apparence */}
        {!isTemplateTab && !isApparenceTab && (
          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckCircle size={15} />
                Enregistré
              </span>
            )}
            <Button onClick={handleSave} loading={saving}>
              Enregistrer les paramètres
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
