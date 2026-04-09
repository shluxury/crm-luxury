'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createChauffeurAction, updateChauffeurAction } from '@/app/actions/chauffeurs'
import type { Chauffeur } from '@/types/database'

const LANGUES = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Italien', 'Russe', 'Chinois', 'Japonais']

const schema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  tel: z.string().optional().default(''),
  email: z.string().optional().default(''),
  statut: z.enum(['disponible', 'indisponible', 'en_mission']).default('disponible'),
  langues: z.array(z.string()).default([]),
  numero_vtc: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface ChauffeurFormProps {
  chauffeur?: Chauffeur
  onSuccess: () => void
}

export default function ChauffeurForm({ chauffeur, onSuccess }: ChauffeurFormProps) {
  const [serverError, setServerError] = useState('')
  const [selectedLangues, setSelectedLangues] = useState<string[]>(chauffeur?.langues ?? [])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: chauffeur ? {
      nom: chauffeur.nom,
      tel: chauffeur.tel ?? '',
      email: chauffeur.email ?? '',
      statut: chauffeur.statut as 'disponible' | 'indisponible' | 'en_mission',
      langues: chauffeur.langues,
      numero_vtc: chauffeur.numero_vtc ?? '',
    } : { statut: 'disponible', langues: [] },
  })

  function toggleLangue(langue: string) {
    const updated = selectedLangues.includes(langue)
      ? selectedLangues.filter((l) => l !== langue)
      : [...selectedLangues, langue]
    setSelectedLangues(updated)
    setValue('langues', updated)
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    const result = chauffeur
      ? await updateChauffeurAction(chauffeur.id, { ...data, langues: selectedLangues })
      : await createChauffeurAction({ ...data, langues: selectedLangues })

    if (result?.error) setServerError(result.error)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nom complet *" {...register('nom')} error={errors.nom?.message} placeholder="Mohammed Al-Rashid" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone" {...register('tel')} placeholder="+33 6 00 00 00 00" />
        <Input label="Email" {...register('email')} type="email" placeholder="chauffeur@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Statut"
          {...register('statut')}
          options={[
            { value: 'disponible', label: 'Disponible' },
            { value: 'indisponible', label: 'Indisponible' },
            { value: 'en_mission', label: 'En mission' },
          ]}
        />
        <Input label="Numéro carte VTC" {...register('numero_vtc')} placeholder="VTC-12345" />
      </div>

      {/* Langues */}
      <div>
        <p className="mb-2 text-xs font-medium text-neutral-300">Langues parlées</p>
        <div className="flex flex-wrap gap-2">
          {LANGUES.map((langue) => (
            <button
              key={langue}
              type="button"
              onClick={() => toggleLangue(langue)}
              className={`rounded-lg border px-3 py-1 text-xs transition ${
                selectedLangues.includes(langue)
                  ? 'border-[#C9A060]/50 bg-[#C9A060]/10 text-[#C9A060]'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
              }`}
            >
              {langue}
            </button>
          ))}
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">{serverError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting}>
          {chauffeur ? 'Enregistrer' : 'Ajouter le chauffeur'}
        </Button>
      </div>
    </form>
  )
}
