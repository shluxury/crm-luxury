# CRM SH Luxury — Project

## What This Is

CRM interne pour la gestion de réservations luxury : chauffeur VTC, hélicoptère, jet privé, restaurant, location voiture de luxe. Deux entités opérationnelles : Leader Limousines (France / EUR) et Leader Concierge Dubai (UAE / AED-USD).

## Core Value

Permettre à une petite équipe de gérer des réservations haut de gamme avec un suivi complet : clients, chauffeurs, partenaires, dossiers, facturation et planning — le tout dans un seul outil rapide et fiable.

## Context

- Stack : Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, Supabase (PostgreSQL + RLS), React Hook Form + Zod v4, Brevo (emails), Stripe (paiements), Airlabs (vols), lucide-react
- Déployé sur Vercel + Supabase cloud (repo : shluxury/crm-luxury)
- Référence gold standard : `crm.html` (11 693 lignes — prototype HTML/JS complet dans le repo)
- 9 modules : Dashboard, Réservations, Clients, Chauffeurs, Partenaires, Dossiers, Facturation, Planning, Paramètres

## Current Milestone: v1.0 — Audit CRM — Alignement complet sur crm.html

**Goal:** Auditer chaque module section par section en comparant crm.html avec notre implémentation Next.js, puis corriger tous les écarts identifiés.

**Target features:**
- Audit Dashboard : stats, missions à venir 7j, alertes vols, widgets
- Audit Réservations : table complète, filtres, form complet, statuts inline, actions PDF/email/facturer
- Audit Clients : table, form corporate, tags, fiche avec historique réservations
- Audit Chauffeurs : table, form, statut disponibilité, missions assignées
- Audit Partenaires : table, form, stats missions/CA/dû, fiche détail
- Audit Dossiers : table, form, réservations liées, total CA/marge, facture groupée
- Audit Facturation : table, form, statuts, PDF, envoi email
- Audit Planning : vues semaine / jour / mois, filtres chauffeur + service
- Audit Paramètres : entités, intégrations, templates email, brevo

## Active Requirements

See REQUIREMENTS.md

## Validated Requirements

_(none yet — first milestone)_

## Key Decisions

- crm.html est la référence autoritaire pour les fonctionnalités
- **Règle absolue : une section à la fois.** Analyser en profondeur → coder jusqu'au 100% → vérifier → seulement alors passer à la suivante. JAMAIS analyser tout puis coder tout.
- Chaque phase = une section complète (analyse + implémentation + vérification dans la même phase)
- Une phase ne se ferme pas tant que la section n'est pas à 100% par rapport à crm.html
- Les corrections sont ordonnées par priorité métier (bloquant > important > nice-to-have) au sein de chaque section
- Pas de refactoring technique pendant l'audit — focus sur les fonctionnalités manquantes

## Out of Scope

- Refactoring architectural
- Changement de stack
- Nouvelles fonctionnalités non présentes dans crm.html

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
_Last updated: 2026-04-09 — Milestone v1.0 started_
