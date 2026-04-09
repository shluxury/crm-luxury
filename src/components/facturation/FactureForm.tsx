'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createFactureAction, updateFactureAction, getNextNumero } from '@/app/actions/factures'
import type { Client } from '@/types/database'

const schema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  client_id: z.string().optional().nullable(),
  entite: z.enum(['leader_limousines', 'leader_concierge_dubai']).default('leader_limousines'),
  montant: z.coerce.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  statut: z.enum(['draft', 'sent', 'paid']).default('draft'),
  notes: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface FactureFormProps {
  facture?: Record<string, unknown>
  clients: Client[]
  onSuccess: () => void
}

export default function FactureForm({ facture, clients, onSuccess }: FactureFormProps) {
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: facture ? {
      numero: facture.numero as string,
      client_id: (facture.client_id as string) ?? null,
      entite: facture.entite as FormData['entite'],
      montant: facture.montant as number,
      currency: facture.currency as FormData['currency'],
      mode_paiement: (facture.mode_paiement as FormData['mode_paiement']) ?? null,
      statut: facture.statut as FormData['statut'],
      notes: (facture.notes as string) ?? '',
    } : {
      entite: 'leader_limousines',
      currency: 'EUR',
      statut: 'draft',
      montant: 0,
    },
  })

  useEffect(() => {
    if (!facture) {
      getNextNumero('leader_limousines').then((num) => setValue('numero', num))
    }
  }, [facture, setValue])

  async function onSubmit(data: FormData) {
    setServerError('')
    const payload = {
      ...data,
      client_id: data.client_id || null,
      mode_paiement: data.mode_paiement ?? null,
    }
    const result = facture
      ? await updateFactureAction(facture.id as string, payload)
      : await createFactureAction(payload)

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Numéro de facture *" {...register('numero')} error={errors.numero?.message} placeholder="LL-2025-001" />
        <Select label="Entité" {...register('entite')} options={[
          { value: 'leader_limousines', label: 'Leader Limousines' },
          { value: 'leader_concierge_dubai', label: 'Leader Concierge Dubai' },
        ]} />
      </div>

      <Select label="Client" {...register('client_id')} placeholder="Aucun client associé"
        options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}${c.entreprise ? ` — ${c.entreprise}` : ''}` }))} />

      <div className="grid grid-cols-3 gap-3">
        <Input label="Montant" type="number" step="0.01" {...register('montant')} className="col-span-2" />
        <Select label="Devise" {...register('currency')} options={[
          { value: 'EUR', label: 'EUR €' },
          { value: 'USD', label: 'USD $' },
          { value: 'AED', label: 'AED د.إ' },
          { value: 'GBP', label: 'GBP £' },
        ]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Mode de paiement" {...register('mode_paiement')} placeholder="Non défini" options={[
          { value: 'sumup', label: 'SumUp' },
          { value: 'stripe', label: 'Stripe (lien)' },
          { value: 'tpe', label: 'TPE' },
          { value: 'virement_fr', label: 'Virement France' },
          { value: 'virement_dubai', label: 'Virement Dubai' },
          { value: 'especes', label: 'Espèces' },
          { value: 'currenxie_us_usd', label: 'Currenxie US/USD' },
          { value: 'currenxie_uk_eur', label: 'Currenxie UK/EUR' },
          { value: 'currenxie_hk_hkd', label: 'Currenxie HK/HKD' },
          { value: 'currenxie_hk_eur', label: 'Currenxie HK/EUR' },
        ]} />
        <Select label="Statut" {...register('statut')} options={[
          { value: 'draft', label: 'Brouillon' },
          { value: 'sent', label: 'Envoyée' },
          { value: 'paid', label: 'Payée' },
        ]} />
      </div>

      <Textarea label="Notes" {...register('notes')} rows={3} placeholder="Informations complémentaires..." />

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting}>
          {facture ? 'Enregistrer' : 'Créer la facture'}
        </Button>
      </div>
    </form>
  )
}
