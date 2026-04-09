# Roadmap — v1.0 Audit CRM Alignement crm.html

## Structure

**9 phases** | **50 requirements** | Approche : une section = analyse + code + vérification 100% avant de passer à la suite

> **Règle d'or :** Chaque phase se termine seulement quand la section est à parité fonctionnelle complète avec crm.html. Ne jamais fermer une phase avec des fonctionnalités manquantes connues.

---

## Phase 1 — Dashboard

**Goal :** Le dashboard Next.js est identique ou supérieur à crm.html : stats du mois, missions 7j, alertes vols, résumé entités, réservations non facturées.

**Requirements :** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06

**Agent task :**
1. Lire crm.html section dashboard (chercher `id="section-dashboard"` ou équivalent)
2. Lire `src/app/(crm)/dashboard/` + `src/components/dashboard/`
3. Produire GAP list exhaustive avec priorité
4. Implémenter tous les écarts
5. Vérifier visuellement et fonctionnellement vs crm.html

**Success criteria :**
1. Toutes les stats (CA, nb missions, marge, perçu) sont affichées pour le mois en cours
2. La liste missions 7j affiche date/heure/client/service/chauffeur cliquable
3. Les alertes vols des 24h suivantes s'affichent avec statut et retard
4. Les stats sont séparées par entité (Leader Limo vs Leader Dubai)
5. Les réservations non facturées sont visibles et accessibles
6. Zero régression : le reste du CRM fonctionne toujours

---

## Phase 2 — Réservations

**Goal :** Le module réservations est complet à 100% vs crm.html : toutes les colonnes, tous les filtres, formulaire entier (extras, commission, MAD, restaurant), toutes les actions inline.

**Requirements :** RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, RES-07, RES-08, RES-09, RES-10, RES-11, RES-12

**Agent task :**
1. Lire crm.html section réservations (table + modal form + actions)
2. Lire `src/components/reservations/` (ReservationsClient, ReservationForm, tous les sous-composants)
3. Produire GAP list exhaustive (colonnes manquantes, filtres manquants, champs form manquants, actions manquantes)
4. Implémenter tous les écarts — un à un, sans sauter
5. Vérifier chaque fonctionnalité implémentée avant la suivante

**Success criteria :**
1. La table affiche toutes les colonnes présentes dans crm.html
2. Tous les filtres de crm.html sont disponibles (statut, service, entité, chauffeur, partenaire, date range)
3. Le formulaire couvre 100% des champs crm.html (y compris extras, commission, wait time, stops)
4. Statut inline dropdown fonctionne avec prompt annulation
5. Fact_statut cycle inline fonctionne
6. Bon de mission, panneau, facturer, email, duplicate, Stripe — tous opérationnels
7. Total client temps réel (montant + extras + frais) s'affiche dans le formulaire

---

## Phase 3 — Clients

**Goal :** Le module clients est complet : table avec stats, formulaire corporate complet, fiche détail avec historique réservations.

**Requirements :** CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07

**Agent task :**
1. Lire crm.html section clients (table + modal form + fiche client)
2. Lire `src/components/clients/` + `src/app/(crm)/clients/`
3. GAP list exhaustive
4. Implémenter — priority : fiche historique (la plus complexe) en premier
5. Vérifier client particulier ET corporate

**Success criteria :**
1. Table liste avec colonnes crm.html (nb réservations, total dépensé visible)
2. Filtres par tag, type, langue fonctionnels
3. Formulaire corporate complet (tous les champs société)
4. Fiche client ouvre avec toutes ses réservations listées
5. Total dépensé et nb réservations calculés sur la fiche
6. Tags gérables inline ou depuis la fiche
7. Préférences client affichées sur la fiche

---

## Phase 4 — Chauffeurs

**Goal :** Le module chauffeurs est complet : statut disponibilité inline, missions assignées visibles, fiche détail.

**Requirements :** CHA-01, CHA-02, CHA-03, CHA-04, CHA-05

**Agent task :**
1. Lire crm.html section chauffeurs
2. Lire `src/components/chauffeurs/`
3. GAP list + implémentation complète

**Success criteria :**
1. Statut disponibilité change inline depuis la liste
2. Nombre de missions assignées visible par chauffeur
3. Fiche chauffeur avec prochaines missions + historique
4. Contact direct (tel/email) accessible depuis la liste

---

## Phase 5 — Partenaires

**Goal :** Le module partenaires est complet : stats réelles, fiche détail, paiement, filtres zone.

**Requirements :** PAR-01, PAR-02, PAR-03, PAR-04, PAR-05

**Agent task :**
1. Lire crm.html section partenaires
2. Lire `src/components/partenaires/`
3. GAP list + implémentation

**Success criteria :**
1. Table avec missions, CA, montant dû correctement calculés
2. Fiche partenaire complète (stats + détails + IBAN)
3. Véhicules et chauffeurs Monaco affichés si applicable
4. Fonctionnalité "marquer payé" opérationnelle
5. Filtre par zone fonctionne

---

## Phase 6 — Dossiers

**Goal :** Le module dossiers est complet : réservations liées avec totaux, encaisser, facture groupée.

**Requirements :** DOS-01, DOS-02, DOS-03, DOS-04, DOS-05, DOS-06

**Agent task :**
1. Lire crm.html section dossiers (liste + détail dossier + encaisser + facture groupée)
2. Lire `src/components/dossiers/` + `src/app/actions/dossiers.ts`
3. GAP list + implémentation — la facture groupée est la partie la plus complexe

**Success criteria :**
1. Chaque dossier montre ses réservations liées dans un sous-tableau
2. Total CA, marge, et montant perçu calculés et affichés
3. Modal encaisser fonctionne avec historique
4. Facture groupée crée une facture multi-lignes depuis plusieurs réservations
5. Statut dossier modifiable inline

---

## Phase 7 — Facturation

**Goal :** Le module facturation est complet : liste filtrée, statuts inline, PDF, envoi email.

**Requirements :** FAC-01, FAC-02, FAC-03, FAC-04, FAC-05, FAC-06, FAC-07

**Agent task :**
1. Lire crm.html section facturation
2. Lire `src/components/facturation/` + `src/app/actions/factures.ts` + `src/app/api/pdf/facture/`
3. GAP list + implémentation

**Success criteria :**
1. Table avec toutes les colonnes crm.html
2. Filtres statut, entité, date fonctionnels
3. Statut inline (draft → sent → paid) avec changement direct
4. PDF s'ouvre dans un nouvel onglet avec mise en page professionnelle
5. Email envoie la facture via Brevo
6. Numéro auto-généré par entité+année au format correct

---

## Phase 8 — Planning

**Goal :** Le module planning est complet : vues semaine/jour/mois, timeline, filtres, navigation.

**Requirements :** PLA-01, PLA-02, PLA-03, PLA-04, PLA-05, PLA-06

**Agent task :**
1. Lire crm.html section planning (toutes les vues)
2. Lire `src/app/(crm)/planning/` + composants planning
3. GAP list + implémentation — vue jour et vue mois sont probablement manquantes

**Success criteria :**
1. Vue semaine avec timeline 6h-23h et missions positionnées correctement
2. Vue jour : timeline complète d'une journée
3. Vue mois : calendrier mensuel avec missions par jour
4. Navigation précédent/suivant fonctionne dans les 3 vues
5. Filtres chauffeur + service appliqués dans les 3 vues
6. Clic sur mission ouvre le détail de réservation

---

## Phase 9 — Paramètres

**Goal :** Le module paramètres est complet : toutes les entités configurables, toutes les intégrations, templates email avec preview.

**Requirements :** PAR-SET-01, PAR-SET-02, PAR-SET-03, PAR-SET-04, PAR-SET-05, PAR-SET-06

**Agent task :**
1. Lire crm.html section paramètres
2. Lire `src/components/parametres/` + `src/app/actions/settings.ts`
3. GAP list + implémentation

**Success criteria :**
1. Chaque entité : tous les champs configurables (nom, adresse, SIRET, TVA, IBAN, devise, pays, actif)
2. Activation/désactivation entité fonctionne et est répercutée dans les sélecteurs
3. Clés API sauvegardées et utilisées (Airlabs, Google Maps, Stripe)
4. Config Brevo (clé + envoi auto) sauvegardée
5. Éditeur templates : FR/EN, sujet, HTML, preview avec substitution variables
6. Reset template individuel fonctionne

---

## Phase Order Rationale

Ordre priorisé par fréquence d'utilisation métier :
1. Dashboard (vue d'ensemble quotidienne)
2. Réservations (cœur du métier, le plus complexe)
3. Clients (lié à chaque réservation)
4. Chauffeurs (opérationnel quotidien)
5. Partenaires (gestion sous-traitants)
6. Dossiers (groupement réservations)
7. Facturation (aval des réservations)
8. Planning (visualisation)
9. Paramètres (configuration, rarement modifié)
