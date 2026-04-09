'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createPartenaireAction, updatePartenaireAction } from '@/app/actions/partenaires'
import type { Partenaire } from '@/types/database'

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  contact: z.string().optional().default(''),
  tel: z.string().optional().default(''),
  email: z.string().optional().default(''),
  zone: z.string().optional().default(''),
  siret: z.string().optional().default(''),
  tva: z.string().optional().default(''),
  forme_juridique: z.string().optional().default(''),
  iban: z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  cp: z.string().optional().default(''),
  ville: z.string().optional().default(''),
  pays: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  has_monaco: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface PartenaireFormProps {
  partenaire?: Partenaire
  onSuccess: () => void
}

export default function PartenaireForm({ partenaire, onSuccess }: PartenaireFormProps) {
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: partenaire ? {
      nom: partenaire.nom,
      contact: partenaire.contact ?? '',
      tel: partenaire.tel ?? '',
      email: partenaire.email ?? '',
      zone: partenaire.zone ?? '',
      siret: partenaire.siret ?? '',
      tva: partenaire.tva ?? '',
      forme_juridique: partenaire.forme_juridique ?? '',
      iban: partenaire.iban ?? '',
      adresse: partenaire.adresse ?? '',
      cp: partenaire.cp ?? '',
      ville: partenaire.ville ?? '',
      pays: partenaire.pays ?? '',
      notes: partenaire.notes ?? '',
      has_monaco: partenaire.has_monaco,
    } : { has_monaco: false },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = partenaire
      ? await updatePartenaireAction(partenaire.id, data)
      : await createPartenaireAction(data)

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nom société *" {...register('nom')} error={errors.nom?.message} className="col-span-2" />
        <Input label="Nom du contact" {...register('contact')} />
        <Input label="Zone géographique" {...register('zone')} placeholder="Paris, IDF, Monaco..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone" {...register('tel')} />
        <Input label="Email" {...register('email')} type="email" />
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <p className="text-xs font-medium text-neutral-400">Informations légales</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="SIRET" {...register('siret')} />
          <Input label="N° TVA" {...register('tva')} />
        </div>
        <Input label="Forme juridique" {...register('forme_juridique')} placeholder="SARL, SAS, Auto-entrepreneur..." />
        <Input label="IBAN" {...register('iban')} placeholder="FR76..." />
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <p className="text-xs font-medium text-neutral-400">Adresse</p>
        <Input label="Adresse" {...register('adresse')} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="CP" {...register('cp')} />
          <Input label="Ville" {...register('ville')} className="col-span-2" />
        </div>
        <Input label="Pays" {...register('pays')} defaultValue="France" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="has_monaco" {...register('has_monaco')} className="accent-[#C9A060]" />
        <label htmlFor="has_monaco" className="text-xs text-neutral-300">Opérateur Monaco</label>
      </div>

      <Textarea label="Notes" {...register('notes')} placeholder="Tarifs négociés, remarques..." />

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting}>
          {partenaire ? 'Enregistrer' : 'Ajouter le partenaire'}
        </Button>
      </div>
    </form>
  )
}
