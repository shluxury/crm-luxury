import { Building2, Globe, Phone, Mail, MapPin, CreditCard } from 'lucide-react'

const entities = [
  {
    id: 'leader_limousines',
    nom: 'Leader Limousines',
    pays: 'France',
    devise: 'EUR €',
    flag: '🇫🇷',
    adresse: "Monaco / Côte d'Azur",
    tel: '+33 6 00 00 00 00',
    email: 'contact@leader-limousines.com',
    couleur: 'border-l-[#C9A060]',
    siret: 'SIRET : à compléter',
    tva: 'TVA : FR00 000 000 000',
  },
  {
    id: 'leader_concierge_dubai',
    nom: 'Leader Concierge Dubai',
    pays: 'Émirats Arabes Unis',
    devise: 'AED / USD',
    flag: '🇦🇪',
    adresse: 'Dubai, UAE',
    tel: '+971 50 000 0000',
    email: 'contact@leader-concierge.ae',
    couleur: 'border-l-sky-500',
    siret: 'TRN : à compléter',
    tva: 'VAT : à compléter',
  },
]

const paiements = [
  { label: 'SumUp', desc: 'TPE mobile / lien de paiement', badge: 'bg-emerald-900/40 text-emerald-400' },
  { label: 'Stripe', desc: 'Lien de paiement en ligne', badge: 'bg-violet-900/40 text-violet-400' },
  { label: 'Virement France', desc: 'IBAN BNP Paribas', badge: 'bg-blue-900/40 text-blue-400' },
  { label: 'Virement Dubai', desc: 'Compte bancaire UAE', badge: 'bg-sky-900/40 text-sky-400' },
  { label: 'Currenxie', desc: 'US/USD · UK/EUR · HK/HKD · HK/EUR', badge: 'bg-amber-900/40 text-amber-400' },
  { label: 'Espèces', desc: 'Paiement en liquide', badge: 'bg-neutral-800 text-neutral-400' },
  { label: 'TPE', desc: 'Terminal physique en voiture', badge: 'bg-neutral-800 text-neutral-400' },
]

export default function Page() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Paramètres</h1>
        <p className="mt-0.5 text-sm text-neutral-400">Configuration du CRM Leader Luxury</p>
      </div>

      {/* Entités */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
          <Building2 size={15} className="text-[#C9A060]" />
          Entités juridiques
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {entities.map((e) => (
            <div key={e.id}
              className={`rounded-xl border border-neutral-800 border-l-2 ${e.couleur} bg-neutral-900 p-4`}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{e.flag} {e.nom}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{e.pays} · {e.devise}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-neutral-400">
                <div className="flex items-center gap-2"><MapPin size={11} className="text-neutral-600" />{e.adresse}</div>
                <div className="flex items-center gap-2"><Phone size={11} className="text-neutral-600" />{e.tel}</div>
                <div className="flex items-center gap-2"><Mail size={11} className="text-neutral-600" />{e.email}</div>
                <div className="flex items-center gap-2"><Globe size={11} className="text-neutral-600" />{e.siret}</div>
                <div className="flex items-center gap-2"><Globe size={11} className="text-neutral-600" />{e.tva}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modes de paiement */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
          <CreditCard size={15} className="text-[#C9A060]" />
          Modes de paiement configurés
        </h2>
        <div className="rounded-xl border border-neutral-800 divide-y divide-neutral-800/50">
          {paiements.map((p) => (
            <div key={p.label} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{p.label}</p>
                <p className="text-xs text-neutral-500">{p.desc}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.badge}`}>Actif</span>
            </div>
          ))}
        </div>
      </section>

      {/* Devises */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Devises supportées</h2>
        <div className="flex gap-2">
          {['EUR €', 'USD $', 'AED د.إ', 'GBP £'].map((d) => (
            <span key={d} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300">{d}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
