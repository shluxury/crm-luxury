# CLAUDE.md - CRM Luxury Chauffeur & Conciergerie

## Description

CRM interne pour gestion de réservations luxury : chauffeur VTC, hélicoptère, jet privé, restaurant, location voiture de luxe.

**Deux entités :** Leader Limousines (France / EUR) et Leader Concierge Dubai (UAE / AED-USD)

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 App Router |
| Langage | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Composants UI | lucide-react + composants custom dans `src/components/ui/` |
| Formulaires | React Hook Form + Zod |
| Base de données | Supabase (PostgreSQL + Auth + RLS) |
| Client Supabase | `@supabase/ssr` |
| Emails | Brevo API v3 (Server Action) |
| Paiements | Stripe (Server Action) |
| Vols | AviationStack API gratuit - 500 req/mois (Server Action) |
| Maps | Google Maps Places API (clé publique) |
| IA | Claude API - Anthropic (Server Action) |
| Déploiement | Vercel + Supabase cloud |

---

## Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (crm)/                    # Layout avec sidebar
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── chauffeurs/page.tsx
│   │   ├── partenaires/page.tsx
│   │   ├── dossiers/page.tsx
│   │   ├── facturation/page.tsx
│   │   ├── planning/page.tsx
│   │   └── parametres/page.tsx
│   ├── actions/                  # Server Actions (secrets côté serveur)
│   │   ├── reservations.ts
│   │   ├── clients.ts
│   │   ├── emails.ts             # Brevo
│   │   ├── paiements.ts          # Stripe
│   │   ├── vols.ts               # AviationStack
│   │   └── ia.ts                 # Claude API
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Boutons, inputs, modals, badges...
│   ├── layout/                   # Sidebar, Header
│   ├── reservations/             # Composants du module réservations
│   └── clients/                  # Composants du module clients
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client (Server Components/Actions)
│   └── utils.ts                  # cn(), formatCurrency(), etc.
└── types/
    └── database.ts               # Types Supabase + enums métier
```

---

## Conventions

### Sécurité (règle absolue)
- `NEXT_PUBLIC_` = clé publique uniquement (Supabase anon, Stripe publishable, Google Maps)
- Toute clé secrète (Brevo, Stripe secret, AviationStack, Anthropic) = **Server Action uniquement**, jamais dans un composant client
- Valider avec Zod toute entrée utilisateur avant persistance

### TypeScript
- `strict: true` - pas de `any`
- Utiliser les types de `src/types/database.ts` pour tout ce qui touche Supabase
- Interfaces pour les props de composants

### Composants
- Server Components par défaut - ajouter `'use client'` uniquement si nécessaire (interactivité, hooks)
- Nommage : PascalCase pour les composants (`ReservationCard.tsx`)
- Props typées avec interface `XxxProps`

### Supabase
- Toujours utiliser `createClient()` depuis `@/lib/supabase/server` dans les Server Components et Actions
- Toujours utiliser `createClient()` depuis `@/lib/supabase/client` dans les Client Components
- RLS activée sur toutes les tables - ne jamais utiliser la `service_role` key côté client

---

## Commandes

```bash
npm run dev          # Serveur de développement (localhost:3000)
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # ESLint
npm run format       # Prettier (à ajouter dans package.json)
```

---

## Variables d'environnement

Voir `.env.example` - copier en `.env.local` (jamais committer `.env.local`).
