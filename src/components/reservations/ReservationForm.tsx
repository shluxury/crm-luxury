'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Search, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { createReservationAction, updateReservationAction } from '@/app/actions/reservations'
import { lookupFlightAction, type FlightInfo } from '@/app/actions/vols'
import type { Client, Chauffeur, Partenaire } from '@/types/database'
import { useEntiteOptions, useDeviseDefaut } from '@/components/providers/SettingsProvider'

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
  'Mercedes Maybach', 'Mercedes EQS', 'Range Rover Vogue',
  'Range Rover Sport', 'Rolls-Royce Phantom', 'Bentley Flying Spur',
  'BMW 7 Series', 'Audi A8', 'Tesla Model S',
]

const schema = z.object({
  service: z.enum(['transfert_aeroport', 'transfert_simple', 'mise_a_disposition', 'helicoptere', 'jet_prive', 'restaurant', 'location_voiture']),
  entite: z.string().default('entite_1'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().min(1, 'Heure requise'),
  client_id: z.string().min(1, 'Client requis'),
  source_chauffeur: z.enum(['interne', 'partenaire']).default('interne'),
  chauffeur_id: z.string().optional().default(''),
  partenaire_id: z.string().optional().default(''),
  dossier_id: z.string().optional().default(''),
  ref_partenaire: z.string().optional().default(''),
  depart: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  num_vol: z.string().optional().default(''),
  nb_heures: z.coerce.number().optional().nullable(),
  mad_itinerary: z.string().optional().default(''),
  wait_hours: z.coerce.number().optional().nullable(),
  wait_rate: z.coerce.number().optional().nullable(),
  pax: z.coerce.number().min(1).default(1),
  bagages: z.coerce.number().min(0).default(0),
  vehicule: z.string().optional().default(''),
  montant: z.coerce.number().min(0).default(0),
  cout: z.coerce.number().min(0).default(0),
  currency: z.enum(['EUR', 'USD', 'AED', 'GBP']).default('EUR'),
  mode_paiement: z.enum(['sumup', 'stripe', 'tpe', 'virement_fr', 'virement_dubai', 'especes', 'currenxie_us_usd', 'currenxie_uk_eur', 'currenxie_hk_hkd', 'currenxie_hk_eur']).optional().nullable(),
  repercuter_frais: z.boolean().default(false),
  taux_frais_client: z.coerce.number().default(2.95),
  montant_percu: z.coerce.number().min(0).default(0),
  statut: z.enum(['devis', 'confirmed', 'paid', 'part_paid', 'completed', 'cancelled']).default('devis'),
  fact_statut: z.string().default('non_facture'),
  cancel_reason: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  resto: z.string().optional().default(''),
  couverts: z.coerce.number().optional().nullable(),
  occasion: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
  demandes_resto: z.string().optional().default(''),
  pricing_mode: z.enum(['marge', 'commission']).default('marge'),
  montant_vol: z.coerce.number().optional().nullable(),
  comm_taux: z.coerce.number().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Extra {
  desc: string
  qty: number
  price: number
  type: 'panier' | 'libre'
}

interface ReservationFormProps {
  reservation?: Record<string, unknown>
  clients: Client[]
  chauffeurs: Chauffeur[]
  partenaires: Partenaire[]
  dossiers: { id: string; nom: string }[]
  onSuccess: () => void
}

export default function ReservationForm({ reservation, clients, chauffeurs, partenaires, dossiers, onSuccess }: ReservationFormProps) {
  const [serverError, setServerError] = useState('')
  const [stops, setStops] = useState<string[]>((reservation?.stops as string[]) ?? [])
  const [extras, setExtras] = useState<Extra[]>(() => {
    const raw = reservation?.extras
    if (Array.isArray(raw)) return raw as Extra[]
    return []
  })
  const [flightLookup, setFlightLookup] = useState<{ loading: boolean; data?: FlightInfo; error?: string }>({ loading: false })
  const entiteOptions = useEntiteOptions()
  const deviseDefaut = useDeviseDefaut()

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: reservation ? {
      service: reservation.service as FormData['service'],
      entite: reservation.entite as string,
      date: reservation.date as string,
      heure: (reservation.heure as string)?.slice(0, 5),
      client_id: reservation.client_id as string,
      source_chauffeur: ((reservation.partenaire_id as string) ? 'partenaire' : 'interne') as 'interne' | 'partenaire',
      chauffeur_id: (reservation.chauffeur_id as string) ?? '',
      partenaire_id: (reservation.partenaire_id as string) ?? '',
      dossier_id: (reservation.dossier_id as string) ?? '',
      ref_partenaire: (reservation.ref_partenaire as string) ?? '',
      depart: (reservation.depart as string) ?? '',
      destination: (reservation.destination as string) ?? '',
      num_vol: (reservation.num_vol as string) ?? '',
      nb_heures: (reservation.nb_heures as number) ?? undefined,
      mad_itinerary: (reservation.mad_itinerary as string) ?? '',
      wait_hours: (reservation.wait_hours as number) ?? undefined,
      wait_rate: (reservation.wait_rate as number) ?? undefined,
      pax: reservation.pax as number,
      bagages: reservation.bagages as number,
      vehicule: (reservation.vehicule as string) ?? '',
      montant: reservation.montant as number,
      cout: reservation.cout as number,
      currency: reservation.currency as FormData['currency'],
      mode_paiement: (reservation.mode_paiement as FormData['mode_paiement']) ?? null,
      repercuter_frais: (reservation.repercuter_frais as boolean) ?? false,
      taux_frais_client: (reservation.taux_frais_client as number) ?? 2.95,
      montant_percu: reservation.montant_percu as number,
      statut: reservation.statut as FormData['statut'],
      fact_statut: (reservation.fact_statut as string) ?? 'non_facture',
      cancel_reason: (reservation.cancel_reason as string) ?? '',
      notes: (reservation.notes as string) ?? '',
      resto: (reservation.resto as string) ?? '',
      couverts: (reservation.couverts as number) ?? undefined,
      occasion: (reservation.occasion as string) ?? '',
      allergies: (reservation.allergies as string) ?? '',
      demandes_resto: (reservation.demandes_resto as string) ?? '',
      pricing_mode: (reservation.pricing_mode as FormData['pricing_mode']) ?? 'marge',
      montant_vol: (reservation.montant_vol as number) ?? undefined,
      comm_taux: (reservation.comm_taux as number) ?? undefined,
    } : {
      service: 'transfert_aeroport',
      entite: entiteOptions[0]?.value ?? 'entite_1',
      currency: deviseDefaut,
      source_chauffeur: 'interne',
      statut: 'devis',
      fact_statut: 'non_facture',
      pax: 1,
      bagages: 0,
      montant: 0,
      cout: 0,
      montant_percu: 0,
      repercuter_frais: false,
      taux_frais_client: 2.95,
    },
  })

  const service = watch('service')
  const sourceChauffeur = watch('source_chauffeur')
  const repercuterFrais = watch('repercuter_frais')
  const tauxFrais = watch('taux_frais_client') ?? 2.95
  const montantValue = watch('montant') ?? 0
  const waitHoursValue = watch('wait_hours') ?? 0
  const waitRateValue = watch('wait_rate') ?? 0
  const statutValue = watch('statut')
  const currencyValue = watch('currency')
  const pricingMode = watch('pricing_mode')
  const montantVol = watch('montant_vol') ?? 0
  const commTaux = watch('comm_taux') ?? 0

  const isTransfert = ['transfert_aeroport', 'transfert_simple'].includes(service)
  const isAeroport = service === 'transfert_aeroport'
  const isMAD = service === 'mise_a_disposition'
  const isHeli = service === 'helicoptere'
  const isJet = service === 'jet_prive'
  const isRestaurant = service === 'restaurant'
  const hasVehicule = isTransfert || isMAD || service === 'location_voiture'
  const hasFlight = isAeroport || isHeli || isJet
  const hasTrajet = !isRestaurant
  const isHeliJet = isHeli || isJet
  const fraisAmount = repercuterFrais ? +(montantValue * tauxFrais / 100).toFixed(2) : 0
  const waitCost = waitHoursValue && waitRateValue ? +(waitHoursValue * waitRateValue).toFixed(2) : 0
  const extrasTotal = extras.reduce((sum, e) => sum + (e.qty * e.price), 0)
  const commissionAmount = pricingMode === 'commission' ? +(montantVol * commTaux / 100).toFixed(2) : 0

  function addExtra(type: 'panier' | 'libre') {
    setExtras((e) => [...e, { desc: type === 'panier' ? 'Panier repas' : '', qty: 1, price: 0, type }])
  }
  function updateExtra(i: number, field: keyof Extra, val: string | number) {
    setExtras((e) => e.map((x, j) => j === i ? { ...x, [field]: val } : x))
  }
  function removeExtra(i: number) {
    setExtras((e) => e.filter((_, j) => j !== i))
  }

  function addStop() { setStops((s) => [...s, '']) }
  function updateStop(i: number, val: string) { setStops((s) => s.map((x, j) => (j === i ? val : x))) }
  function removeStop(i: number) { setStops((s) => s.filter((_, j) => j !== i)) }

  async function handleFlightLookup() {
    const numVol = watch('num_vol') ?? ''
    if (!numVol.trim()) return
    setFlightLookup({ loading: true })
    const result = await lookupFlightAction(numVol.trim())
    if (result.error) {
      setFlightLookup({ loading: false, error: result.error })
    } else {
      setFlightLookup({ loading: false, data: result.data })
    }
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { source_chauffeur, ...rest } = data
    const payload = {
      ...rest,
      stops: stops.filter((s) => s.trim()),
      chauffeur_id: data.chauffeur_id || null,
      partenaire_id: data.partenaire_id || null,
      dossier_id: data.dossier_id || null,
      mode_paiement: data.mode_paiement ?? null,
      couverts: data.couverts || null,
      nb_heures: data.nb_heures || null,
      wait_hours: data.wait_hours || null,
      wait_rate: data.wait_rate || null,
      extras,
      montant_vol: data.montant_vol || null,
      comm_taux: data.comm_taux || null,
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
        <Select label="Entité" {...register('entite')} options={entiteOptions} />
      </div>

      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />
        <Input label="Heure *" type="time" {...register('heure')} error={errors.heure?.message} />
      </div>

      {/* Client + Dossier */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Client *" {...register('client_id')} error={errors.client_id?.message}
          placeholder="Sélectionner un client"
          options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}${c.entreprise ? ` — ${c.entreprise}` : ''}` }))} />
        <Select label="Dossier" {...register('dossier_id')} placeholder="Aucun"
          options={dossiers.map((d) => ({ value: d.id, label: d.nom }))} />
      </div>

      {/* Source chauffeur + sélecteur */}
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Attribution</p>
          <div className="flex items-center rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setValue('source_chauffeur', 'interne'); setValue('partenaire_id', ''); }}
              className="px-3 py-1.5 transition"
              style={sourceChauffeur === 'interne'
                ? { background: 'var(--bg-4)', color: 'var(--text)' }
                : { color: 'var(--text-muted)', background: 'transparent' }}>
              Mes chauffeurs
            </button>
            <button
              type="button"
              onClick={() => { setValue('source_chauffeur', 'partenaire'); setValue('chauffeur_id', ''); }}
              className="px-3 py-1.5 transition"
              style={sourceChauffeur === 'partenaire'
                ? { background: 'var(--bg-4)', color: 'var(--text)' }
                : { color: 'var(--text-muted)', background: 'transparent' }}>
              Sous-traitant
            </button>
          </div>
        </div>
        {sourceChauffeur === 'interne' ? (
          <Select label="Chauffeur" {...register('chauffeur_id')} placeholder="Aucun"
            options={chauffeurs.map((c) => ({ value: c.id, label: c.nom }))} />
        ) : (
          <div className="space-y-2">
            <Select label="Partenaire sous-traitant" {...register('partenaire_id')} placeholder="Aucun"
              options={partenaires.map((p) => ({ value: p.id, label: p.nom }))} />
            <Input label="Référence partenaire" {...register('ref_partenaire')} placeholder="BL-2025-042" />
          </div>
        )}
      </div>

      {/* Trajet */}
      {hasTrajet && (
        <div className="space-y-2 rounded-lg border border-neutral-800 p-3">
          <p className="text-xs font-medium text-neutral-400">Trajet</p>
          <Input label="Départ" {...register('depart')} placeholder="Adresse, aéroport, hôtel..." />

          {(isTransfert || isMAD) && (
            <div className="space-y-1.5">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={stop}
                    onChange={(e) => updateStop(i, e.target.value)}
                    placeholder={`Arrêt ${i + 1}`}
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600"
                  />
                  <button type="button" onClick={() => removeStop(i)}
                    className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addStop}
                className="flex items-center gap-1.5 text-xs text-neutral-500 transition hover:text-[#C9A060]">
                <Plus size={12} /> Ajouter un arrêt
              </button>
            </div>
          )}

          <Input label="Destination" {...register('destination')} placeholder="Adresse d'arrivée..." />
          {hasFlight && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">N° de vol</label>
              <div className="flex gap-2">
                <input {...register('num_vol')} placeholder="AF1234, EK142..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-600" />
                <button type="button" onClick={handleFlightLookup} disabled={flightLookup.loading}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50">
                  {flightLookup.loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  Lookup
                </button>
              </div>
              {flightLookup.error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={11} />{flightLookup.error}</p>
              )}
              {flightLookup.data && (
                <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-green-400 font-medium">
                    <CheckCircle2 size={12} />
                    Vol trouvé — {flightLookup.data.dep_iata} → {flightLookup.data.arr_iata}
                    {flightLookup.data.status && <span className="ml-auto text-neutral-500">{flightLookup.data.status}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-neutral-400">
                    {flightLookup.data.dep_time && <span>Départ prévu : {flightLookup.data.dep_time.slice(11, 16)}</span>}
                    {flightLookup.data.arr_time && <span>Arrivée prévue : {flightLookup.data.arr_time.slice(11, 16)}</span>}
                    {flightLookup.data.dep_estimated && <span>Départ estimé : {flightLookup.data.dep_estimated.slice(11, 16)}</span>}
                    {flightLookup.data.arr_estimated && <span>Arrivée estimée : {flightLookup.data.arr_estimated.slice(11, 16)}</span>}
                    {(flightLookup.data.dep_delayed ?? 0) > 0 && <span className="text-amber-400">Retard départ : {flightLookup.data.dep_delayed} min</span>}
                    {(flightLookup.data.arr_delayed ?? 0) > 0 && <span className="text-amber-400">Retard arrivée : {flightLookup.data.arr_delayed} min</span>}
                    {flightLookup.data.dep_terminal && <span>Terminal départ : {flightLookup.data.dep_terminal}</span>}
                    {flightLookup.data.dep_gate && <span>Porte : {flightLookup.data.dep_gate}</span>}
                    {flightLookup.data.arr_terminal && <span>Terminal arrivée : {flightLookup.data.arr_terminal}</span>}
                    {flightLookup.data.arr_gate && <span>Porte arrivée : {flightLookup.data.arr_gate}</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MAD */}
      {isMAD && (
        <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
          <p className="text-xs font-medium text-[#C9A060]">Mise à disposition</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Durée (heures)" type="number" step="0.5" min="0" {...register('nb_heures')} placeholder="4" />
            <div />
          </div>
          <Textarea label="Itinéraire / Programme" {...register('mad_itinerary')} rows={2}
            placeholder="10h00 hôtel — 11h30 réunion centre — 14h00 déjeuner..." />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input label="Heures d'attente" type="number" step="0.5" min="0" {...register('wait_hours')} placeholder="0" />
            </div>
            <div>
              <Input label="Taux / heure attente" type="number" step="0.01" min="0" {...register('wait_rate')} placeholder="0.00" />
              {waitCost > 0 && (
                <p className="mt-1 text-xs text-[#C9A060]">
                  Coût attente : {waitCost.toLocaleString()} {currencyValue}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restaurant */}
      {isRestaurant && (
        <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
          <p className="text-xs font-medium text-[#C9A060]">Détails restaurant</p>
          <Input label="Nom du restaurant" {...register('resto')} placeholder="Le Jules Verne, Nobu..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Couverts" type="number" min="1" {...register('couverts')} placeholder="2" />
            <Input label="Occasion" {...register('occasion')} placeholder="Anniversaire, fiançailles..." />
          </div>
          <Input label="Allergies / régimes" {...register('allergies')} placeholder="Sans gluten, végétarien..." />
          <Textarea label="Demandes spéciales" {...register('demandes_resto')} rows={2}
            placeholder="Table en terrasse, gâteau surprise, déco fleurs..." />
        </div>
      )}

      {/* Commission héli/jet */}
      {isHeliJet && (
        <div className="space-y-3 rounded-lg border border-amber-900/20 bg-amber-950/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#C9A060]">Mode de tarification</p>
            <div className="flex items-center rounded-lg border border-neutral-700 overflow-hidden text-xs">
              <button type="button"
                onClick={() => setValue('pricing_mode', 'marge')}
                className={`px-3 py-1.5 transition ${pricingMode === 'marge' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                Marge
              </button>
              <button type="button"
                onClick={() => setValue('pricing_mode', 'commission')}
                className={`px-3 py-1.5 transition ${pricingMode === 'commission' ? 'bg-amber-900/50 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'}`}>
                Commission
              </button>
            </div>
          </div>
          {pricingMode === 'commission' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Montant vol opérateur" type="number" step="0.01" min="0" {...register('montant_vol')}
                  placeholder="0.00" />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-400">Taux commission</label>
                  <select {...register('comm_taux')}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-neutral-600">
                    <option value="">Choisir...</option>
                    <option value="10">10%</option>
                    <option value="7.5">7.5%</option>
                    <option value="5.5">5.5%</option>
                    <option value="5">5%</option>
                    <option value="3">3%</option>
                  </select>
                </div>
              </div>
              {commissionAmount > 0 && (
                <div className="rounded-lg bg-amber-950/20 border border-amber-900/30 px-3 py-2 text-xs text-amber-300">
                  Notre commission : <span className="font-semibold">{commissionAmount.toLocaleString()} {currencyValue}</span>
                  {' '}({commTaux}% de {montantVol.toLocaleString()} {currencyValue})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extras */}
      <div className="space-y-2 rounded-lg border border-neutral-800 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-400">Suppléments / Extras</p>
          <div className="flex items-center gap-2">
            {isMAD && (
              <button type="button" onClick={() => addExtra('panier')}
                className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:text-[#C9A060] hover:border-[#C9A060]/30">
                <Plus size={11} /> Panier repas
              </button>
            )}
            <button type="button" onClick={() => addExtra('libre')}
              className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:text-[#C9A060] hover:border-[#C9A060]/30">
              <Plus size={11} /> Extra libre
            </button>
          </div>
        </div>
        {extras.length === 0 ? (
          <p className="text-xs text-neutral-600 italic">Aucun extra ajouté</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-1.5 text-xs text-neutral-500 px-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-center">Qté</span>
              <span className="col-span-3 text-center">Prix unit.</span>
              <span className="col-span-1 text-right">Total</span>
              <span className="col-span-1" />
            </div>
            {extras.map((extra, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                <input
                  value={extra.desc}
                  onChange={(e) => updateExtra(i, 'desc', e.target.value)}
                  placeholder={extra.type === 'panier' ? 'Panier repas' : 'Description...'}
                  className="col-span-5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-2 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-600"
                />
                <input
                  type="number" min="0" step="1"
                  value={extra.qty}
                  onChange={(e) => updateExtra(i, 'qty', +e.target.value)}
                  className="col-span-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-neutral-600"
                />
                <input
                  type="number" min="0" step="0.01"
                  value={extra.price}
                  onChange={(e) => updateExtra(i, 'price', +e.target.value)}
                  className="col-span-3 rounded-lg border border-neutral-700 bg-neutral-800/50 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-neutral-600"
                />
                <span className="col-span-1 text-right text-xs text-neutral-400">
                  {(extra.qty * extra.price).toFixed(0)}
                </span>
                <button type="button" onClick={() => removeExtra(i)}
                  className="col-span-1 flex justify-center rounded p-1 text-neutral-600 transition hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {extrasTotal > 0 && (
              <div className="flex justify-end border-t border-neutral-800 pt-2">
                <span className="text-xs text-[#C9A060]">Total extras : {extrasTotal.toLocaleString()} {currencyValue}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Véhicule + PAX + Bagages */}
      {hasVehicule ? (
        <div className="grid grid-cols-3 gap-3">
          <Select label="Véhicule" {...register('vehicule')} placeholder="Sélectionner"
            options={VEHICULES.map((v) => ({ value: v, label: v }))} />
          <Input label="PAX" type="number" min="1" {...register('pax')} />
          <Input label="Bagages" type="number" min="0" {...register('bagages')} />
        </div>
      ) : !isRestaurant ? (
        <div className="grid grid-cols-2 gap-3">
          <Input label="PAX" type="number" min="1" {...register('pax')} />
          <Input label="Bagages" type="number" min="0" {...register('bagages')} />
        </div>
      ) : null}

      {/* Financier */}
      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <p className="text-xs font-medium text-neutral-400">Financier</p>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Montant client" type="number" step="0.01" min="0" {...register('montant')} />
          <Input label="Coût partenaire" type="number" step="0.01" min="0" {...register('cout')} />
          <Select label="Devise" {...register('currency')} options={[
            { value: 'EUR', label: 'EUR €' },
            { value: 'USD', label: 'USD $' },
            { value: 'AED', label: 'AED د.إ' },
            { value: 'GBP', label: 'GBP £' },
          ]} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="repercuter_frais" {...register('repercuter_frais')}
              className="rounded border-neutral-700 bg-neutral-800 accent-[#C9A060]" />
            <label htmlFor="repercuter_frais" className="text-xs text-neutral-300">
              Répercuter les frais de paiement au client
            </label>
          </div>
          {repercuterFrais && (
            <div className="flex items-center gap-3 pl-5">
              <div className="w-28">
                <Input label="Taux (%)" type="number" step="0.01" min="0" {...register('taux_frais_client')} />
              </div>
              {fraisAmount > 0 && (
                <p className="mt-4 text-xs text-[#C9A060]">
                  +{fraisAmount} {currencyValue} de frais — Total client : {(montantValue + fraisAmount).toFixed(2)} {currencyValue}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Mode de paiement" {...register('mode_paiement')} placeholder="Non défini"
            options={[
              { value: 'sumup', label: 'SumUp (1.4%)' },
              { value: 'stripe', label: 'Stripe (3.5%)' },
              { value: 'tpe', label: 'TPE' },
              { value: 'virement_fr', label: 'Virement bancaire' },
              { value: 'virement_dubai', label: 'Virement international' },
              { value: 'especes', label: 'Espèces' },
              { value: 'currenxie_us_usd', label: 'Currenxie US/USD' },
              { value: 'currenxie_uk_eur', label: 'Currenxie UK/EUR' },
              { value: 'currenxie_hk_hkd', label: 'Currenxie HK/HKD' },
              { value: 'currenxie_hk_eur', label: 'Currenxie HK/EUR' },
            ]} />
          <Input label="Montant perçu" type="number" step="0.01" min="0" {...register('montant_percu')} />
        </div>

        {(extrasTotal > 0 || fraisAmount > 0) && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 space-y-1 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Montant de base</span>
              <span>{montantValue.toLocaleString()} {currencyValue}</span>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Extras</span>
                <span>+{extrasTotal.toLocaleString()} {currencyValue}</span>
              </div>
            )}
            {fraisAmount > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Frais paiement ({tauxFrais}%)</span>
                <span>+{fraisAmount} {currencyValue}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-700 pt-1 font-semibold text-white">
              <span>Total client</span>
              <span>{(montantValue + extrasTotal + fraisAmount).toLocaleString()} {currencyValue}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statuts */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Select label="Statut réservation" {...register('statut')} options={[
            { value: 'devis', label: 'Devis' },
            { value: 'confirmed', label: 'Confirmé' },
            { value: 'paid', label: 'Payé' },
            { value: 'part_paid', label: 'Partiellement payé' },
            { value: 'completed', label: 'Terminé' },
            { value: 'cancelled', label: 'Annulé' },
          ]} />
          {statutValue === 'cancelled' && (
            <div className="mt-2">
              <Input {...register('cancel_reason')} placeholder="Motif d'annulation..." />
            </div>
          )}
        </div>
        <Select label="Statut facturation" {...register('fact_statut')} options={[
          { value: 'non_facture', label: 'Non facturé' },
          { value: 'a_facturer', label: 'À facturer' },
          { value: 'facture', label: 'Facturé' },
        ]} />
      </div>

      <Textarea label="Notes internes" {...register('notes')} placeholder="Remarques, instructions particulières..." rows={2} />

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
