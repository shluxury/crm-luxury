'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createReservationAction, updateReservationAction } from '@/app/actions/reservations'
import type { Client, Chauffeur, Partenaire } from '@/types/database'

const SERVICES = [
  { value: 'transfert_aeroport', label: 'Transfert aéroport' },
  { value: 'transfert_simple', label: 'Transfert simple' },
  { value: 'mise_a_disposition', label: 'Mise à disposition' },
  { value: 'helicoptere', label: 'Hélicoptère' },
  { value: 'jet_prive', label: 'Jet privé' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'location_voiture', label: 'Location voiture' },
]

const VEHICULES = [
  'Mercedes V-Class', 'Mercedes S-Class', 'Mercedes E-Class',
  'Range Rover Vogue', 'Mercedes Maybach',
]

const schema = z.object({
  service: z.enum(['transfert_aeroport', 'transfert_simple', 'mise_a_disposition', 'helicoptere', 'jet_prive', 'restaurant', 'location_voiture']),
  entite: z.enum(['leader_limousines', 'leader_concierge_dubai']).default('leader_limousines'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().min(1, 'Heure requise'),
  client_id: z.string().min(1, 'Client requis'),
  chauffeur_id: z.string().optional().default(''),
  partenaire_id: z.string().optional().default(''),
  depart: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  pax: z.coerce.number().min(1).default(1),
  bagages: z.coerce.number().min(0).default(0),
  vehicule: z.string().optional().default(''),
  num_vol: z.string().optional().default(''),
  montant: z.coerce.number().min(0).default(0),
  cout: z.coerce.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  montant_percu: z.coerce.number().min(0).default(0),
  statut: z.enum(['devis', 'confirmed', 'paid', 'part_paid', 'completed', 'cancelled']).default('devis'),
  notes: z.string().optional().default(''),
  resto: z.string().optional().default(''),
  couverts: z.coerce.number().optional(),
  occasion: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface ReservationFormProps {
  reservation?: Record<string, unknown>
  clients: Client[]
  chauffeurs: Chauffeur[]
  partenaires: Partenaire[]
  onSuccess: () => void
}

export default function ReservationForm({ reservation, clients, chauffeurs, partenaires, onSuccess }: ReservationFormProps) {
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: reservation ? {
      service: reservation.service as FormData['service'],
      entite: reservation.entite as FormData['entite'],
      date: reservation.date as string,
      heure: (reservation.heure as string)?.slice(0, 5),
      client_id: reservation.client_id as string,
      chauffeur_id: (reservation.chauffeur_id as string) ?? '',
      partenaire_id: (reservation.partenaire_id as string) ?? '',
      depart: (reservation.depart as string) ?? '',
      destination: (reservation.destination as string) ?? '',
      pax: reservation.pax as number,
      bagages: reservation.bagages as number,
      vehicule: (reservation.vehicule as string) ?? '',
      num_vol: (reservation.num_vol as string) ?? '',
      montant: reservation.montant as number,
      cout: reservation.cout as number,
      currency: reservation.currency as FormData['currency'],
      mode_paiement: (reservation.mode_paiement as FormData['mode_paiement']) ?? null,
      montant_percu: reservation.montant_percu as number,
      statut: reservation.statut as FormData['statut'],
      notes: (reservation.notes as string) ?? '',
      resto: (reservation.resto as string) ?? '',
      couverts: reservation.couverts as number,
      occasion: (reservation.occasion as string) ?? '',
      allergies: (reservation.allergies as string) ?? '',
    } : {
      service: 'transfert_aeroport',
      entite: 'leader_limousines',
      currency: 'EUR',
      statut: 'devis',
      pax: 1,
      bagages: 0,
      montant: 0,
      cout: 0,
      montant_percu: 0,
    },
  })

  const service = watch('service')
  const isRestaurant = service === 'restaurant'
  const isTransfert = ['transfert_aeroport', 'transfert_simple', 'mise_a_disposition'].includes(service)

  async function onSubmit(data: FormData) {
    setServerError('')
    const payload = {
      ...data,
      chauffeur_id: data.chauffeur_id || null,
      partenaire_id: data.partenaire_id || null,
      mode_paiement: data.mode_paiement ?? null,
      couverts: data.couverts || null,
    }
    const result = reservation
      ? await updateReservationAction(reservation.id as string, payload)
      : await createReservationAction(payload)

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Service + Entité */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Service *" {...register('service')} options={SERVICES} error={errors.service?.message} />
        <Select label="Entité" {...register('entite')} options={[
          { value: 'leader_limousines', label: 'Leader Limousines' },
          { value: 'leader_concierge_dubai', label: 'Leader Concierge Dubai' },
        ]} />
      </div>

      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />
        <Input label="Heure *" type="time" {...register('heure')} error={errors.heure?.message} />
      </div>

      {/* Client */}
      <Select label="Client *" {...register('client_id')} error={errors.client_id?.message}
        placeholder="Sélectionner un client"
        options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}${c.entreprise ? ` - ${c.entreprise}` : ''}` }))}
      />

      {/* Chauffeur / Partenaire */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Chauffeur" {...register('chauffeur_id')} placeholder="Aucun"
          options={chauffeurs.map((c) => ({ value: c.id, label: c.nom }))} />
        <Select label="Partenaire" {...register('partenaire_id')} placeholder="Aucun"
          options={partenaires.map((p) => ({ value: p.id, label: p.nom }))} />
      </div>

      {/* Trajet (pour services de transport) */}
      {isTransfert && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Départ" {...register('depart')} placeholder="Adresse de départ" />
            <Input label="Destination" {...register('destination')} placeholder="Adresse d'arrivée" />
          </div>
          <Input label="Numéro de vol" {...register('num_vol')} placeholder="AF1234" />
        </>
      )}

      {/* Véhicule + PAX */}
      {isTransfert && (
        <div className="grid grid-cols-3 gap-3">
          <Select label="Véhicule" {...register('vehicule')} placeholder="Sélectionner"
            options={VEHICULES.map((v) => ({ value: v, label: v }))} className="col-span-2" />
          <Input label="PAX" type="number" min="1" {...register('pax')} />
        </div>
      )}

      {/* Restaurant */}
      {isRestaurant && (
        <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
          <p className="text-xs font-medium text-[#C9A060]">Détails restaurant</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom du restaurant" {...register('resto')} className="col-span-2" />
            <Input label="Couverts" type="number" {...register('couverts')} />
            <Input label="Occasion" {...register('occasion')} placeholder="Anniversaire..." />
          </div>
          <Input label="Allergies" {...register('allergies')} />
        </div>
      )}

      {/* Financier */}
      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <p className="text-xs font-medium text-neutral-400">Financier</p>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Montant client" type="number" step="0.01" {...register('montant')} />
          <Input label="Coût partenaire" type="number" step="0.01" {...register('cout')} />
          <Select label="Devise" {...register('currency')} options={[
            { value: 'EUR', label: 'EUR €' },
            { value: 'USD', label: 'USD $' },
            { value: 'AED', label: 'AED د.إ' },
            { value: 'GBP', label: 'GBP £' },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Mode de paiement" {...register('mode_paiement')} placeholder="Non défini"
            options={[
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
          <Input label="Montant perçu" type="number" step="0.01" {...register('montant_percu')} />
        </div>
      </div>

      {/* Statut */}
      <Select label="Statut" {...register('statut')} options={[
        { value: 'devis', label: 'Devis' },
        { value: 'confirmed', label: 'Confirmé' },
        { value: 'paid', label: 'Payé' },
        { value: 'part_paid', label: 'Partiellement payé' },
        { value: 'completed', label: 'Terminé' },
        { value: 'cancelled', label: 'Annulé' },
      ]} />

      <Textarea label="Notes" {...register('notes')} placeholder="Remarques, instructions particulières..." />

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting}>
          {reservation ? 'Enregistrer' : 'Créer la réservation'}
        </Button>
      </div>
    </form>
  )
}
