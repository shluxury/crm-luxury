# STATE — CRM SH Luxury

## Current Position

Phase: TOUTES COMPLETES (9/9)
Plan: Audit complet vs crm.html terminé
Status: Build zero erreur TypeScript — prêt pour production
Last activity: 2026-04-09 — Phases 6-9 complétées

## Accumulated Context

- Stack : Next.js 16 App Router, TypeScript strict, Tailwind v4, Supabase, Zod v4 (`.issues` pas `.errors`)
- Zod + zodResolver : toujours caster `as Resolver<FormData>` quand on utilise `.default()`
- Supabase joins retournent `never` → toujours caster `data as unknown as Record<string, unknown>`
- SettingsProvider a son propre DEFAULT_SETTINGS à garder synchronisé avec `actions/settings.ts`
- AppSettings.localisation doit être ajouté à DEUX endroits : `actions/settings.ts` ET `providers/SettingsProvider.tsx`
- crm.html est à `/Users/nayar/Desktop/CRM SHluxury/crm.html` (11 693 lignes)
- DB directe Supabase : `postgresql://postgres:qO2GMRv7QVAduayP@db.ikksounintlhhhweuzjv.supabase.co:5432/postgres`
- Entités configurées : `leader_limousines` (France/EUR) + `leader_concierge_dubai` (UAE/AED)
- Airlabs remplace AviationStack (api v9)
- SQL migrations dans `sql/` (002_extras_commission.sql déjà créé)
- TypeScript JSX gotcha : `unknown` en JSX → utiliser `!!value &&` (pas `value &&`)
- Factures : statuts DB = draft | sent | paid | retard (crm.html utilise envoyee à la place de sent)

## Phases complétées

### Phase 1 — Dashboard
- 6 KPI cards (CA mois, Missions, En attente clients, Dû partenaires, Marge nette, CA Année)
- Navigation mois (prev/next/label)
- Masquer/Afficher montants
- Partenaires à payer (expandable)
- Dossiers à encaisser (progress bars)
- CA par service (groupes Chauffeur/Conciergerie)
- CA mensuel N vs N-1 (6 mois)
- Missions à venir 7j
- À facturer section
- Alertes dynamiques

### Phase 2 — Réservations
- ActionsDropdown (menu déroulant au lieu de boutons hover)
- serviceCell() colorée A/M/T/H/J/R/L
- Filter tabs (Tout/Att.paiement/Devis/Terminé/Annulé)
- Filtres avancés (date from/to, service, entité)
- Tri par date (asc/desc)
- Row expansion → panel détail
- Missions passées grisées (opacity-50/60)

### Phase 3 — Clients
- getClientsWithStats() avec missions_count et ca_total
- Colonnes Missions + CA total
- Filtres type (particulier/corporate) + tag
- Avatar corporate bleu vs particulier or
- Corporate badge + contact affiché
- Tags as small badges
- Actions : Nouvelle résa, Email, Edit, Suppr

### Phase 4 — Chauffeurs
- ChauffeurWithStats avec missions_mois
- Toggle statut inline (disponible/en_mission/indisponible cycle)
- Initiales dans avatar or
- Stat missions ce mois
- Bouton Brief → mailto

### Phase 5 — Partenaires
- PartenaireStats (missions_total, missions_mois, ca_total, du_mois)
- Filter tabs (Tous/À payer/Soldé) + toggle Monaco MC
- Barre de recherche
- Card layout (pas tableau)
- Stats grid 4 colonnes
- Liste chauffeurs en badges
- Contact inline (tel, email links)
- Badge "Soldé ✓" vs "Dû : €X"

### Phase 6 — Dossiers
- Chargement des réservations attachées par dossier_id
- Calcul total_dossier depuis réservations
- Filter tabs (Tous/En cours/Terminés/Archivés)
- Card layout avec stats (nb resas, total, encaissé, restant)
- Expandable liste réservations (ChevronDown/Up)
- EncaisserModal amélioré (contexte total/encaissé/restant)
- Notes affichées en bas de card

### Phase 7 — Facturation
- Ajout statut "retard" (4 statuts : draft/sent/paid/retard)
- Filter tabs (Toutes/Draft/Envoyées/Payées/En retard)
- Colonne Entité (badge LL/LC)
- Colonne Prestation (depuis réservation liée)
- Mise à jour inline statut (select par ligne)
- Row background colors (rouge pour retard, vert pour payé)
- updateFactureStatutAction() ajoutée
- JOIN reservation dans getFactures()
- PDF button visible (pas sur hover)

### Phase 8 — Planning
- 3 vues : Jour / Semaine / Mois
- Vue Jour : tableau avec colonnes #, Heure, Service (lettre colorée), Client, Prestation, Véhicule, Intervenant
- Vue Semaine : colonnes 7 jours avec mission pills colorées
- Vue Mois : grille calendrier avec dots missions
- Navigation ◀ Aujourd'hui ▶
- Titre dynamique selon vue
- Cellule service colorée (A=airport, M=dispo, T=transfert, H=heli, J=jet, R=resto, L=location)
- Couleur statut par mission (confirmed=gold, paid=green, etc.)

### Phase 9 — Paramètres
- Ajout onglet "Localisation" (Globe icon)
- Champs : langue CRM, langue emails, langue factures, devise défaut, fuseau horaire
- AppSettings.localisation ajouté dans database.ts, actions/settings.ts et SettingsProvider.tsx

## Pending TODOs

Aucun — toutes les phases sont complètes.

## Blockers

Aucun.
