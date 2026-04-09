'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Eye, Code2, RotateCcw, Info } from 'lucide-react'
import { updateSettingAction } from '@/app/actions/settings'
import type { AppSettings } from '@/types/database'
import Button from '@/components/ui/Button'

type Lang = 'fr' | 'en'

// ─── Templates par scope ────────────────────────────────────────
const TEMPLATES_GLOBAL = [
  { id: 'confirmation', label: 'Confirmation réservation', desc: 'Envoyé au client après confirmation', category: 'client' },
  { id: 'paiement',     label: 'Confirmation paiement',    desc: 'Envoyé après réception du paiement', category: 'client' },
  { id: 'rappel',       label: 'Rappel J-1',               desc: 'Rappel envoyé la veille de la mission', category: 'client' },
  { id: 'devis',        label: 'Envoi devis',              desc: 'Proposition tarifaire au client', category: 'client' },
  { id: 'facture',      label: 'Envoi facture',            desc: 'Envoi de la facture au client', category: 'client' },
  { id: 'stripe_link',  label: 'Lien de paiement',         desc: 'Lien Stripe pour paiement en ligne', category: 'client' },
  { id: 'postservice',  label: 'Après prestation',         desc: 'Email de satisfaction post-mission', category: 'client' },
  { id: 'chauffeur_brief', label: 'Brief mission',         desc: 'Brief envoyé au chauffeur assigné', category: 'chauffeur' },
  { id: 'bon_mission',  label: 'Bon de mission',           desc: 'Bon de mission VTC au chauffeur', category: 'chauffeur' },
]

const TEMPLATES_CONCIERGE = [
  { id: 'helico_confirmation', label: 'Confirmation vol hélico', desc: 'Confirmation transfert hélicoptère', category: 'helicoptere' },
  { id: 'helico_devis',        label: 'Devis hélicoptère',       desc: 'Proposition tarifaire vol héliporté', category: 'helicoptere' },
  { id: 'helico_paiement',     label: 'Paiement hélico',         desc: 'Confirmation paiement — vol confirmé', category: 'helicoptere' },
  { id: 'jet_confirmation',    label: 'Confirmation charter',    desc: 'Confirmation vol jet privé', category: 'jet' },
  { id: 'jet_devis',           label: 'Devis charter',           desc: 'Proposition affrètement jet', category: 'jet' },
  { id: 'jet_paiement',        label: 'Paiement charter',        desc: 'Confirmation paiement — charter confirmé', category: 'jet' },
  { id: 'resto_confirmation',  label: 'Confirmation restaurant', desc: 'Confirmation table au restaurant', category: 'restaurant' },
  { id: 'resto_devis',         label: 'Proposition restaurant',  desc: 'Suggestion avec détails restaurant', category: 'restaurant' },
  { id: 'resto_paiement',      label: 'Paiement restaurant',     desc: 'Paiement reçu — table confirmée', category: 'restaurant' },
  { id: 'car_confirmation',    label: 'Confirmation location',   desc: 'Confirmation véhicule de luxe', category: 'location' },
  { id: 'car_devis',           label: 'Devis location',          desc: 'Proposition véhicule & tarif', category: 'location' },
  { id: 'car_paiement',        label: 'Paiement location',       desc: 'Paiement reçu — location confirmée', category: 'location' },
]

const SCOPE_LABELS: Record<string, string> = {
  global:    'Leader Limousines (global)',
  concierge: 'Leader Concierge Dubai',
}

const CATEGORY_LABELS: Record<string, string> = {
  client:      'Clients',
  chauffeur:   'Chauffeurs',
  helicoptere: 'Hélicoptère',
  jet:         'Jet Privé',
  restaurant:  'Restaurant',
  location:    'Location',
}

const VARIABLES = [
  { key: '{{prenom}}',      desc: 'Prénom du client' },
  { key: '{{nom}}',         desc: 'Nom du client' },
  { key: '{{service}}',     desc: 'Type de service' },
  { key: '{{date}}',        desc: 'Date de la réservation' },
  { key: '{{heure}}',       desc: 'Heure de prise en charge' },
  { key: '{{depart}}',      desc: 'Lieu de départ' },
  { key: '{{destination}}', desc: 'Destination' },
  { key: '{{num_vol}}',     desc: 'Numéro de vol' },
  { key: '{{vehicule}}',    desc: 'Véhicule assigné' },
  { key: '{{pax}}',         desc: 'Nombre de passagers' },
  { key: '{{montant}}',     desc: 'Montant de la prestation' },
  { key: '{{currency}}',    desc: 'Devise (EUR, USD…)' },
  { key: '{{entite_nom}}',  desc: 'Nom de la société' },
  { key: '{{entite_tel}}',  desc: 'Téléphone société' },
  { key: '{{entite_email}}',desc: 'Email société' },
  { key: '{{notes}}',       desc: 'Notes de réservation' },
  { key: '{{chauffeur}}',   desc: 'Nom du chauffeur' },
  { key: '{{appareil}}',    desc: 'Appareil/Hélico/Jet' },
  { key: '{{stripe_url}}',  desc: 'Lien de paiement Stripe' },
]

const SAMPLE_DATA: Record<string, string> = {
  prenom: 'Alexandre', nom: 'Martin', service: 'Transfert aéroport',
  date: 'lundi 15 janvier 2025', heure: '08:30',
  depart: 'Hôtel Hermitage, Monaco', destination: 'Aéroport Nice Côte d\'Azur',
  num_vol: 'AF1234', vehicule: 'Mercedes Classe S', pax: '2',
  montant: '450', currency: 'EUR', entite_nom: 'Leader Limousines',
  entite_tel: '+33 6 00 00 00 00', entite_email: 'contact@leaderlimousines.com',
  notes: 'Client VIP — accueil avec panneau nominatif',
  chauffeur: 'Michel Dupont', appareil: 'Airbus H130',
  stripe_url: 'https://pay.stripe.com/xxxx',
}

function substituteVars(template: string, sample: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => sample[key] ?? `{{${key}}}`)
}

interface EmailTemplatesTabProps {
  settings: AppSettings
}

export default function EmailTemplatesTab({ settings }: EmailTemplatesTabProps) {
  const [scope, setScope] = useState<'global' | 'concierge'>('global')
  const [selectedTemplate, setSelectedTemplate] = useState('confirmation')
  const [lang, setLang] = useState<Lang>('fr')
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')
  const [showVars, setShowVars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [templates, setTemplates] = useState<AppSettings['email_templates']>(
    settings.email_templates ?? {}
  )

  const getTemplate = useCallback((s: string, id: string, l: Lang) => {
    return templates[s]?.[id]?.[l] ?? { subject: '', html: '' }
  }, [templates])

  const current = getTemplate(scope, selectedTemplate, lang)

  const allTemplates = scope === 'global' ? TEMPLATES_GLOBAL : TEMPLATES_CONCIERGE
  const currentTpl = allTemplates.find((t) => t.id === selectedTemplate)

  function setField(field: 'subject' | 'html', value: string) {
    setTemplates((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [selectedTemplate]: {
          ...prev[scope]?.[selectedTemplate],
          [lang]: {
            ...prev[scope]?.[selectedTemplate]?.[lang],
            [field]: value,
          },
        },
      },
    }))
  }

  function resetTemplate() {
    if (!confirm('Réinitialiser ce modèle ? Le contenu sera supprimé.')) return
    setTemplates((prev) => {
      const next = { ...prev }
      if (next[scope]?.[selectedTemplate]) {
        const copy = { ...next[scope][selectedTemplate] }
        delete copy[lang]
        next[scope] = { ...next[scope], [selectedTemplate]: copy }
      }
      return next
    })
  }

  function handleScopeChange(s: 'global' | 'concierge') {
    setScope(s)
    const firstTpl = s === 'global' ? TEMPLATES_GLOBAL[0] : TEMPLATES_CONCIERGE[0]
    setSelectedTemplate(firstTpl.id)
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
    : `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#888;font-family:sans-serif;font-size:14px;background:#f9f9f9;">
        Aucun modèle personnalisé — le template par défaut du système sera utilisé.
      </div>`

  // Regrouper les templates par catégorie
  const byCategory: Record<string, typeof TEMPLATES_GLOBAL> = {}
  for (const t of allTemplates) {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t as (typeof TEMPLATES_GLOBAL)[number])
  }

  return (
    <div className="space-y-4">
      {/* Sélecteur entité */}
      <div className="flex gap-2">
        {(['global', 'concierge'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleScopeChange(s)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={
              scope === s
                ? { background: 'rgba(201,160,96,0.15)', color: '#C9A060', border: '1px solid rgba(201,160,96,0.4)' }
                : { background: 'var(--bg-3)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }
            }
          >
            {SCOPE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="flex gap-4 min-h-[600px]">
        {/* Sidebar templates */}
        <div className="w-56 shrink-0 space-y-1 overflow-y-auto">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <p
                className="mb-1 mt-3 px-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-dim)' }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              {items.map((t) => {
                const hasContent = !!(templates[scope]?.[t.id]?.fr?.html || templates[scope]?.[t.id]?.en?.html)
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className="w-full rounded-lg px-3 py-2.5 text-left transition"
                    style={
                      selectedTemplate === t.id
                        ? { background: 'var(--bg-4)', color: 'var(--text)' }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium leading-tight" style={{ color: 'inherit' }}>{t.label}</p>
                      {hasContent && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" title="Modèle personnalisé" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-tight" style={{ color: 'var(--text-dim)' }}>{t.desc}</p>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Éditeur */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{currentTpl?.label}</h3>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{currentTpl?.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Lang toggle */}
              <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-3)' }}>
                {(['fr', 'en'] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className="rounded px-3 py-1.5 text-xs font-medium uppercase transition"
                    style={
                      lang === l
                        ? { background: 'var(--bg-4)', color: 'var(--text)' }
                        : { color: 'var(--text-dim)' }
                    }>
                    {l}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-3)' }}>
                <button onClick={() => setViewMode('preview')}
                  className="rounded px-2.5 py-1.5 transition"
                  style={viewMode === 'preview' ? { background: 'var(--bg-4)', color: 'var(--text)' } : { color: 'var(--text-dim)' }}
                  title="Aperçu">
                  <Eye size={13} />
                </button>
                <button onClick={() => setViewMode('code')}
                  className="rounded px-2.5 py-1.5 transition"
                  style={viewMode === 'code' ? { background: 'var(--bg-4)', color: 'var(--text)' } : { color: 'var(--text-dim)' }}
                  title="HTML">
                  <Code2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Objet de l&apos;email
              <span className="ml-2" style={{ color: 'var(--text-dim)' }}>(vide = objet généré automatiquement)</span>
            </label>
            <input
              type="text"
              value={current.subject}
              onChange={(e) => setField('subject', e.target.value)}
              placeholder={lang === 'fr' ? 'Ex: Confirmation de votre réservation — {{service}}' : 'Ex: Booking confirmation — {{service}}'}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition"
              style={{
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* Éditeur HTML / Aperçu */}
          <div className="relative overflow-hidden rounded-xl" style={{ border: '1px solid var(--border-soft)' }}>
            {viewMode === 'code' ? (
              <textarea
                value={current.html}
                onChange={(e) => setField('html', e.target.value)}
                placeholder={`<!-- Collez votre HTML ici. Utilisez {{prenom}}, {{service}}, etc. -->\n<!-- Vide = template par défaut du système -->`}
                className="h-[380px] w-full resize-none p-4 font-mono text-xs outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
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
              className="flex items-center gap-1.5 text-xs transition"
              style={{ color: 'var(--text-dim)' }}>
              <Info size={12} />
              {showVars ? 'Masquer les' : 'Voir les'} variables disponibles
            </button>
            {showVars && (
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl p-3" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-3)' }}>
                {VARIABLES.map(({ key, desc }) => (
                  <div key={key} className="flex items-baseline gap-2">
                    <code className="text-xs font-mono text-[#C9A060]">{key}</code>
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button onClick={resetTemplate}
              className="flex items-center gap-1.5 text-xs transition"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E05252')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}>
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
    </div>
  )
}
