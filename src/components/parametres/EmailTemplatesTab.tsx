'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Eye, Code2, RotateCcw, Info } from 'lucide-react'
import { updateSettingAction } from '@/app/actions/settings'
import type { AppSettings } from '@/types/database'
import Button from '@/components/ui/Button'

type Lang = 'fr' | 'en'

const TEMPLATES = [
  {
    id: 'confirmation',
    label: 'Confirmation réservation',
    desc: 'Envoyé au client après création/confirmation',
    category: 'client',
  },
  {
    id: 'paiement',
    label: 'Confirmation paiement',
    desc: 'Envoyé au client après réception du paiement',
    category: 'client',
  },
  {
    id: 'chauffeur_brief',
    label: 'Brief mission',
    desc: 'Envoyé au chauffeur assigné avant la mission',
    category: 'chauffeur',
  },
] as const

type TemplateId = typeof TEMPLATES[number]['id']

const VARIABLES = [
  { key: '{{prenom}}', desc: 'Prénom du client' },
  { key: '{{nom}}', desc: 'Nom du client' },
  { key: '{{service}}', desc: 'Type de service' },
  { key: '{{date}}', desc: 'Date de la réservation' },
  { key: '{{heure}}', desc: 'Heure de prise en charge' },
  { key: '{{depart}}', desc: 'Lieu de départ' },
  { key: '{{destination}}', desc: 'Destination' },
  { key: '{{num_vol}}', desc: 'Numéro de vol' },
  { key: '{{vehicule}}', desc: 'Véhicule assigné' },
  { key: '{{pax}}', desc: 'Nombre de passagers' },
  { key: '{{montant}}', desc: 'Montant de la prestation' },
  { key: '{{currency}}', desc: 'Devise (EUR, USD…)' },
  { key: '{{entite_nom}}', desc: 'Nom de la société' },
  { key: '{{entite_tel}}', desc: 'Téléphone de la société' },
  { key: '{{entite_email}}', desc: 'Email de la société' },
  { key: '{{notes}}', desc: 'Notes de réservation' },
]

function substituteVars(template: string, sample: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => sample[key] ?? `{{${key}}}`)
}

const SAMPLE_DATA: Record<string, string> = {
  prenom: 'Alexandre',
  nom: 'Martin',
  service: 'Transfert aéroport',
  date: 'lundi 15 janvier 2025',
  heure: '08:30',
  depart: 'Hôtel Hermitage, Monaco',
  destination: 'Aéroport Nice Côte d\'Azur',
  num_vol: 'AF1234',
  vehicule: 'Mercedes Classe S',
  pax: '2',
  montant: '450',
  currency: 'EUR',
  entite_nom: 'Leader Limousines',
  entite_tel: '+33 6 00 00 00 00',
  entite_email: 'contact@leaderlimousines.com',
  notes: 'Client VIP — accueil avec panneau nominatif',
}

interface EmailTemplatesTabProps {
  settings: AppSettings
}

export default function EmailTemplatesTab({ settings }: EmailTemplatesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('confirmation')
  const [lang, setLang] = useState<Lang>('fr')
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')
  const [showVars, setShowVars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Templates state — modifiable
  const [templates, setTemplates] = useState<AppSettings['email_templates']>(
    settings.email_templates ?? {}
  )

  const getTemplate = useCallback((id: TemplateId, l: Lang) => {
    return templates[id]?.[l] ?? { subject: '', html: '' }
  }, [templates])

  const current = getTemplate(selectedTemplate, lang)

  function setField(field: 'subject' | 'html', value: string) {
    setTemplates((prev) => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        [lang]: {
          ...prev[selectedTemplate]?.[lang],
          [field]: value,
        },
      },
    }))
  }

  function resetTemplate() {
    if (!confirm('Réinitialiser ce modèle ? Le contenu personnalisé sera supprimé.')) return
    setTemplates((prev) => {
      const next = { ...prev }
      if (next[selectedTemplate]) {
        const copy = { ...next[selectedTemplate] }
        delete copy[lang]
        next[selectedTemplate] = copy
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updateSettingAction('email_templates', templates)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const previewHtml = current.html
    ? substituteVars(current.html, SAMPLE_DATA)
    : `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#666;font-family:sans-serif;font-size:14px;">
        Aucun modèle personnalisé — le template par défaut du système sera utilisé.
      </div>`

  const tpl = TEMPLATES.find((t) => t.id === selectedTemplate)

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Sidebar */}
      <div className="w-52 shrink-0 space-y-1">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Clients</p>
        {TEMPLATES.filter((t) => t.category === 'client').map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
              selectedTemplate === t.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
            }`}
          >
            <p className="text-sm font-medium leading-tight">{t.label}</p>
            <p className="mt-0.5 text-xs text-neutral-500 leading-tight">{t.desc}</p>
          </button>
        ))}
        <p className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Chauffeurs</p>
        {TEMPLATES.filter((t) => t.category === 'chauffeur').map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
              selectedTemplate === t.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
            }`}
          >
            <p className="text-sm font-medium leading-tight">{t.label}</p>
            <p className="mt-0.5 text-xs text-neutral-500 leading-tight">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Éditeur */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">{tpl?.label}</h3>
            <p className="text-xs text-neutral-500">{tpl?.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
              {(['fr', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`rounded px-3 py-1.5 text-xs font-medium uppercase transition ${
                    lang === l ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
              <button onClick={() => setViewMode('preview')}
                className={`rounded px-2.5 py-1.5 transition ${viewMode === 'preview' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Aperçu">
                <Eye size={13} />
              </button>
              <button onClick={() => setViewMode('code')}
                className={`rounded px-2.5 py-1.5 transition ${viewMode === 'code' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="HTML">
                <Code2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Sujet */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">
            Objet de l'email
            <span className="ml-2 text-neutral-600">(vide = objet généré automatiquement)</span>
          </label>
          <input
            type="text"
            value={current.subject}
            onChange={(e) => setField('subject', e.target.value)}
            placeholder={lang === 'fr' ? 'Ex: Confirmation de votre réservation — {{service}}' : 'Ex: Booking confirmation — {{service}}'}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-600"
          />
        </div>

        {/* Éditeur HTML / Aperçu */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800">
          {viewMode === 'code' ? (
            <textarea
              value={current.html}
              onChange={(e) => setField('html', e.target.value)}
              placeholder={`<!-- Collez votre HTML ici. Utilisez {{prenom}}, {{service}}, etc. -->\n<!-- Vide = template par défaut du système -->`}
              className="h-[380px] w-full resize-none bg-neutral-950 p-4 font-mono text-xs text-neutral-300 outline-none"
              spellCheck={false}
            />
          ) : (
            <iframe
              srcDoc={previewHtml}
              className="h-[380px] w-full border-0 bg-white"
              title="Aperçu email"
              sandbox="allow-same-origin"
            />
          )}
        </div>

        {/* Variables */}
        <div>
          <button onClick={() => setShowVars(!showVars)}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition">
            <Info size={12} />
            {showVars ? 'Masquer les' : 'Voir les'} variables disponibles
          </button>
          {showVars && (
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
              {VARIABLES.map(({ key, desc }) => (
                <div key={key} className="flex items-baseline gap-2">
                  <code className="text-xs font-mono text-[#C9A060]">{key}</code>
                  <span className="text-xs text-neutral-500">{desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={resetTemplate}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition">
            <RotateCcw size={12} />
            Réinitialiser ce modèle
          </button>
          <div className="flex items-center gap-3">
            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && <p className="text-xs text-green-400 flex items-center gap-1"><RefreshCw size={11} /> Enregistré</p>}
            <Button onClick={handleSave} loading={saving} size="sm">
              Enregistrer les modèles
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
