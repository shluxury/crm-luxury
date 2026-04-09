# STATE — CRM SH Luxury

## Current Position

Phase: Not started
Plan: —
Status: Roadmap approved, ready to start Phase 1
Last activity: 2026-04-09 — Milestone v1.0 initialized

## Accumulated Context

- Stack : Next.js 16 App Router, TypeScript strict, Tailwind v4, Supabase, Zod v4 (`.issues` pas `.errors`)
- Zod + zodResolver : toujours caster `as Resolver<FormData>` quand on utilise `.default()`
- Supabase joins retournent `never` → toujours caster `data as unknown as Record<string, unknown>`
- SettingsProvider a son propre DEFAULT_SETTINGS à garder synchronisé avec `actions/settings.ts`
- crm.html est à `/Users/nayar/Desktop/CRM SHluxury/crm.html` (11 693 lignes)
- DB directe Supabase : `postgresql://postgres:qO2GMRv7QVAduayP@db.ikksounintlhhhweuzjv.supabase.co:5432/postgres`
- Entités configurées : `leader_limousines` (France/EUR) + `leader_concierge_dubai` (UAE/AED)
- Airlabs remplace AviationStack (api v9)
- SQL migrations dans `sql/` (002_extras_commission.sql déjà créé)

## Pending TODOs

- Phase 1 : audit + fix Dashboard
- Phase 2 : audit + fix Réservations
- Phase 3 : audit + fix Clients
- Phase 4 : audit + fix Chauffeurs
- Phase 5 : audit + fix Partenaires
- Phase 6 : audit + fix Dossiers
- Phase 7 : audit + fix Facturation
- Phase 8 : audit + fix Planning
- Phase 9 : audit + fix Paramètres

## Blockers

Aucun.
