'use client'

import { useState, useEffect } from 'react'
import { Send, Eye, RefreshCw } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { sendEmailAction, getEmailPreview } from '@/app/actions/emails'
import { TEMPLATE_LABELS, type EmailTemplate } from '@/lib/email-templates'

interface EmailModalProps {
  open: boolean
  onClose: () => void
  reservationId: string
  clientEmail?: string
  clientNom?: string
  chauffeurEmail?: string
  chauffeurNom?: string
}

const TEMPLATES: { value: EmailTemplate; label: string }[] = [
  { value: 'confirmation', label: TEMPLATE_LABELS.confirmation },
  { value: 'chauffeur_brief', label: TEMPLATE_LABELS.chauffeur_brief },
  { value: 'paiement', label: TEMPLATE_LABELS.paiement },
]

export default function EmailModal({ open, onClose, reservationId, clientEmail, clientNom, chauffeurEmail, chauffeurNom }: EmailModalProps) {
  const [template, setTemplate] = useState<EmailTemplate>('confirmation')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [toEmail, setToEmail] = useState(clientEmail ?? '')
  const [toName, setToName] = useState(clientNom ?? '')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tab, setTab] = useState<'compose' | 'preview'>('compose')

  // Switch destinataire selon template
  useEffect(() => {
    if (template === 'chauffeur_brief') {
      setToEmail(chauffeurEmail ?? '')
      setToName(chauffeurNom ?? '')
    } else {
      setToEmail(clientEmail ?? '')
      setToName(clientNom ?? '')
    }
  }, [template, clientEmail, clientNom, chauffeurEmail, chauffeurNom])

  async function loadPreview() {
    setLoading(true)
    setError('')
    const result = await getEmailPreview(template, reservationId, lang)
    if ('error' in result) {
      setError(result.error ?? 'Erreur')
    } else {
      setSubject(result.subject)
      setHtml(result.html)
      if (template !== 'chauffeur_brief') {
        setToEmail(result.toEmail || toEmail)
        setToName(result.toName || toName)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template, lang])

  async function handleSend() {
    if (!toEmail) { setError('Email destinataire requis'); return }
    setSending(true)
    setError('')
    const result = await sendEmailAction({
      template,
      reservationId,
      toEmail,
      toName,
      lang,
      chauffeurNom,
      customSubject: subject,
      customHtml: html,
    })
    setSending(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1500)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Envoyer un email" size="xl">
      <div className="space-y-4">
        {/* Contrôles */}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Template" value={template} onChange={(e) => setTemplate(e.target.value as EmailTemplate)}
            options={TEMPLATES} />
          <Select label="Langue" value={lang} onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
            options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email destinataire *" type="email" value={toEmail}
            onChange={(e) => setToEmail(e.target.value)} placeholder="client@example.com" />
          <Input label="Nom destinataire" value={toName}
            onChange={(e) => setToName(e.target.value)} placeholder="Jean Dupont" />
        </div>
        <Input label="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} />

        {/* Onglets */}
        <div className="flex gap-1 rounded-lg border border-neutral-800 p-1">
          <button onClick={() => setTab('compose')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${tab === 'compose' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}>
            HTML
          </button>
          <button onClick={() => setTab('preview')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${tab === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}>
            Aperçu
          </button>
        </div>

        {tab === 'compose' ? (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 font-mono text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600"
            placeholder="HTML de l'email..."
          />
        ) : (
          <div className="rounded-lg border border-neutral-800 overflow-hidden" style={{ height: 320 }}>
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-neutral-500">Chargement...</div>
            ) : (
              <iframe srcDoc={html} className="h-full w-full" sandbox="allow-same-origin" title="Email preview" />
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{error}</p>
        )}
        {success && (
          <p className="rounded-lg border border-green-900 bg-green-950/50 px-3 py-2 text-xs text-green-400">Email envoyé avec succès</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button onClick={loadPreview} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 transition hover:text-white disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Regénérer
          </button>
          <Button onClick={handleSend} loading={sending} disabled={!toEmail || !html}>
            <Send size={14} /> Envoyer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
