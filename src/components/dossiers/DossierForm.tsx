'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createDossierAction, updateDossierAction } from '@/app/actions/dossiers'
import type { Client } from '@/types/database'

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  client_id: z.string().optional().nullable(),
  entite: z.enum(['leader_limousines', 'leader_concierge_dubai']).default('leader_limousines'),
  statut: z.enum(['ouvert', 'ferme', 'archive']).default('ouvert'),
  notes: z.string().optional().default(''),
  montant_percu: z.coerce.number().min(0).default(0),
})

type FormData = z.infer<typeof schema>

interface DossierFormProps {
  dossier?: Record<string, unknown>
  clients: Client[]
  onSuccess: () => void
}

export default function DossierForm({ dossier, clients, onSuccess }: DossierFormProps) {
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: dossier ? {
      nom: dossier.nom as string,
      client_id: (dossier.client_id as string) ?? null,
      entite: dossier.entite as FormData['entite'],
      statut: dossier.statut as FormData['statut'],
      notes: (dossier.notes as string) ?? '',
      montant_percu: dossier.montant_percu as number,
    } : {
      entite: 'leader_limousines',
      statut: 'ouvert',
      montant_percu: 0,
    },
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    const payload = { ...data, client_id: data.client_id || null }
    const result = dossier
      ? await updateDossierAction(dossier.id as string, payload)
      : await createDossierAction(payload)

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nom du dossier *" {...register('nom')} error={errors.nom?.message} placeholder="Grand Prix Monaco 2025" />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Entité" {...register('entite')} options={[
          { value: 'leader_limousines', label: 'Leader Limousines' },
          { value: 'leader_concierge_dubai', label: 'Leader Concierge Dubai' },
        ]} />
        <Select label="Statut" {...register('statut')} options={[
          { value: 'ouvert', label: 'Ouvert' },
          { value: 'ferme', label: 'Fermé' },
          { value: 'archive', label: 'Archivé' },
        ]} />
      </div>

      <Select label="Client" {...register('client_id')} placeholder="Aucun client associé"
        options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}${c.entreprise ? ` — ${c.entreprise}` : ''}` }))} />

      <Input label="Montant perçu (€)" type="number" step="0.01" {...register('montant_percu')} />

      <Textarea label="Notes" {...register('notes')} rows={3} placeholder="Informations sur le dossier..." />

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting}>
          {dossier ? 'Enregistrer' : 'Créer le dossier'}
        </Button>
      </div>
    </form>
  )
}
