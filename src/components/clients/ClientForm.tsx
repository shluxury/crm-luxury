'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import TagBadge from '@/components/ui/TagBadge'
import { createClientAction, updateClientAction } from '@/app/actions/clients'
import type { Client } from '@/types/database'

const VEHICULES = [
  'Mercedes V-Class', 'Mercedes S-Class', 'Mercedes E-Class',
  'Mercedes Maybach', 'Range Rover Vogue', 'Rolls-Royce Phantom',
  'Bentley Flying Spur', 'BMW 7 Series', 'Audi A8',
]

const EAUX = [
  'Évian', 'Fiji', 'San Pellegrino', 'Perrier', 'Volvic', 'Badoit',
  'Acqua Panna', 'Hildon', 'Autre',
]

const TAGS_SUGGESTIONS = ['VIP', 'Corporate', 'Régulier', 'Yacht', 'Famille', 'Fidèle', 'Nouvelle connaissance']

const schema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  tel: z.string().optional().default(''),
  email: z.string().optional().default(''),
  nationalite: z.string().optional().default(''),
  langue: z.enum(['fr', 'en']).default('fr'),
  entreprise: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  is_corporate: z.boolean().default(false),
  corp_nom: z.string().optional().default(''),
  corp_siret: z.string().optional().default(''),
  corp_tva: z.string().optional().default(''),
  corp_adresse: z.string().optional().default(''),
  corp_cp: z.string().optional().default(''),
  corp_ville: z.string().optional().default(''),
  corp_pays: z.string().optional().default(''),
  corp_contact_nom: z.string().optional().default(''),
  corp_contact_tel: z.string().optional().default(''),
  corp_contact_email: z.string().optional().default(''),
  pref_vehicule: z.string().optional().default(''),
  pref_eau: z.string().optional().default(''),
  pref_siege_enfant: z.boolean().default(false),
  pref_notes_chauffeur: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [serverError, setServerError] = useState('')
  const [tags, setTags] = useState<string[]>(client?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: client ? {
      prenom: client.prenom,
      nom: client.nom,
      tel: client.tel ?? '',
      email: client.email ?? '',
      nationalite: client.nationalite ?? '',
      langue: client.langue as 'fr' | 'en',
      entreprise: client.entreprise ?? '',
      notes: client.notes ?? '',
      is_corporate: client.is_corporate,
      corp_nom: client.corp_nom ?? '',
      corp_siret: client.corp_siret ?? '',
      corp_tva: client.corp_tva ?? '',
      corp_adresse: client.corp_adresse ?? '',
      corp_cp: client.corp_cp ?? '',
      corp_ville: client.corp_ville ?? '',
      corp_pays: client.corp_pays ?? '',
      corp_contact_nom: client.corp_contact_nom ?? '',
      corp_contact_tel: client.corp_contact_tel ?? '',
      corp_contact_email: client.corp_contact_email ?? '',
      pref_vehicule: client.pref_vehicule ?? '',
      pref_eau: client.pref_eau ?? '',
      pref_siege_enfant: client.pref_siege_enfant ?? false,
      pref_notes_chauffeur: client.pref_notes_chauffeur ?? '',
    } : { langue: 'fr', is_corporate: false, pref_siege_enfant: false },
  })

  const isCorporate = watch('is_corporate')

  function addTag(tag: string) {
    const t = tag.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  function removeTag(tag: string) { setTags((prev) => prev.filter((t) => t !== tag)) }

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = client
      ? await updateClientAction(client.id, { ...data, tags })
      : await createClientAction({ ...data, tags })

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Infos de base */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prénom *" {...register('prenom')} error={errors.prenom?.message} placeholder="Jean" />
        <Input label="Nom *" {...register('nom')} error={errors.nom?.message} placeholder="Dupont" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone" {...register('tel')} placeholder="+33 6 00 00 00 00" />
        <Input label="Email" {...register('email')} type="email" placeholder="jean@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nationalité" {...register('nationalite')} placeholder="Française" />
        <Select label="Langue" {...register('langue')}
          options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
      </div>
      <Input label="Entreprise" {...register('entreprise')} placeholder="ACME Corp" />

      {/* Tags */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-neutral-400">Tags</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} size="sm" onRemove={() => removeTag(tag)} />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
            placeholder="Ajouter un tag..."
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {TAGS_SUGGESTIONS.filter((t) => !tags.includes(t)).map((t) => (
            <button key={t} type="button" onClick={() => addTag(t)}
              className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400 transition hover:border-[#C9A060]/50 hover:text-[#C9A060]">
              +{t}
            </button>
          ))}
        </div>
      </div>

      {/* Corporate */}
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" id="is_corporate" {...register('is_corporate')}
          className="rounded border-neutral-700 bg-neutral-800 accent-[#C9A060]" />
        <label htmlFor="is_corporate" className="text-xs text-neutral-300">Client corporate (facturation société)</label>
      </div>

      {isCorporate && (
        <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
          <p className="text-xs font-medium text-[#C9A060]">Informations société</p>
          <Input label="Nom société" {...register('corp_nom')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SIRET" {...register('corp_siret')} />
            <Input label="N° TVA intracommunautaire" {...register('corp_tva')} />
          </div>
          <Input label="Adresse" {...register('corp_adresse')} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Code postal" {...register('corp_cp')} />
            <Input label="Ville" {...register('corp_ville')} className="col-span-2" />
          </div>
          <Input label="Pays" {...register('corp_pays')} />
          <p className="pt-1 text-xs font-medium text-neutral-400">Contact facturation</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom contact" {...register('corp_contact_nom')} />
            <Input label="Tél contact" {...register('corp_contact_tel')} />
          </div>
          <Input label="Email contact" {...register('corp_contact_email')} type="email" />
        </div>
      )}

      {/* Préférences */}
      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <p className="text-xs font-medium text-neutral-400">Préférences</p>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Véhicule préféré" {...register('pref_vehicule')} placeholder="Aucune préférence"
            options={VEHICULES.map((v) => ({ value: v, label: v }))} />
          <Select label="Eau" {...register('pref_eau')} placeholder="Aucune préférence"
            options={EAUX.map((e) => ({ value: e, label: e }))} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="pref_siege_enfant" {...register('pref_siege_enfant')}
            className="rounded border-neutral-700 bg-neutral-800 accent-[#C9A060]" />
          <label htmlFor="pref_siege_enfant" className="text-xs text-neutral-300">Siège enfant requis</label>
        </div>
        <Textarea label="Notes chauffeur" {...register('pref_notes_chauffeur')}
          placeholder="Préfère la climatisation forte, allergique aux parfums..." rows={2} />
      </div>

      <Textarea label="Notes internes" {...register('notes')} placeholder="..." rows={2} />

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isSubmitting}>
          {client ? 'Enregistrer' : 'Créer le client'}
        </Button>
      </div>
    </form>
  )
}
