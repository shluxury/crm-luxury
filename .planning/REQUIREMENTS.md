# Requirements — v1.0 Audit CRM Alignement crm.html

## Milestone Goal

Chaque module du CRM Next.js atteint la parité fonctionnelle complète avec crm.html, section par section, dans l'ordre de priorité métier. Une section n'est considérée terminée que quand TOUTES ses fonctionnalités sont implémentées et vérifiées.

---

## Section 1 — Dashboard

- [ ] **DASH-01** : L'utilisateur voit les stats du mois en cours (CA total, nb réservations, marge, montant perçu)
- [ ] **DASH-02** : L'utilisateur voit les missions à venir sur 7 jours avec date, heure, client, service, chauffeur
- [ ] **DASH-03** : L'utilisateur voit les alertes vols des 24h prochaines (retards, annulations via Airlabs)
- [ ] **DASH-04** : L'utilisateur voit un résumé par entité (stats séparées Leader Limo / Leader Dubai)
- [ ] **DASH-05** : L'utilisateur voit les réservations non facturées (fact_statut = non_facture ou a_facturer)
- [ ] **DASH-06** : L'utilisateur peut naviguer directement vers une réservation depuis le dashboard

---

## Section 2 — Réservations

- [ ] **RES-01** : L'utilisateur voit toutes les colonnes de crm.html (date, heure, client, service, entité, trajet, vol, montant, marge, statut, fact_statut)
- [ ] **RES-02** : L'utilisateur peut filtrer par statut, service, entité, chauffeur, partenaire, date range
- [ ] **RES-03** : Le formulaire couvre tous les champs de crm.html (stops, extras, commission héli/jet, MAD itinéraire, restaurant, wait time)
- [ ] **RES-04** : L'utilisateur peut changer le statut inline via dropdown (sans ouvrir le formulaire)
- [ ] **RES-05** : L'utilisateur peut cycler le fact_statut inline
- [ ] **RES-06** : L'utilisateur peut générer un bon de mission PDF depuis la liste
- [ ] **RES-07** : L'utilisateur peut générer un panneau d'accueil PDF depuis la liste
- [ ] **RES-08** : L'utilisateur peut créer une facture depuis une réservation (bouton Facturer)
- [ ] **RES-09** : L'utilisateur peut envoyer un email (confirmation client / brief chauffeur) depuis la liste
- [ ] **RES-10** : L'utilisateur peut dupliquer une réservation
- [ ] **RES-11** : L'utilisateur peut créer un lien de paiement Stripe depuis une réservation
- [ ] **RES-12** : Le calcul du montant total inclut les extras et les frais de paiement en temps réel

---

## Section 3 — Clients

- [ ] **CLI-01** : L'utilisateur voit la liste avec colonnes crm.html (nom, téléphone, email, nationalité, entreprise, tags, nb réservations)
- [ ] **CLI-02** : L'utilisateur peut rechercher et filtrer par tag, type (particulier/corporate), langue
- [ ] **CLI-03** : Le formulaire couvre tous les champs corporate (nom société, adresse, SIRET, TVA, contact)
- [ ] **CLI-04** : L'utilisateur voit la fiche client complète avec historique de toutes ses réservations
- [ ] **CLI-05** : La fiche client affiche le total dépensé, le nombre de réservations, la dernière date
- [ ] **CLI-06** : L'utilisateur peut gérer les tags (ajouter, supprimer) depuis la liste ou la fiche
- [ ] **CLI-07** : L'utilisateur voit les préférences client (véhicule, eau, siège enfant, notes chauffeur)

---

## Section 4 — Chauffeurs

- [ ] **CHA-01** : L'utilisateur voit la liste avec statut disponibilité, langues, numéro VTC
- [ ] **CHA-02** : L'utilisateur peut changer le statut d'un chauffeur inline (disponible / indisponible / en mission)
- [ ] **CHA-03** : L'utilisateur voit le nombre de missions assignées par chauffeur
- [ ] **CHA-04** : La fiche chauffeur montre ses prochaines missions et son historique
- [ ] **CHA-05** : L'utilisateur peut contacter le chauffeur (tel, email) directement depuis la liste

---

## Section 5 — Partenaires

- [ ] **PAR-01** : L'utilisateur voit la liste avec toutes les colonnes crm.html (missions, CA, dû, IBAN masqué)
- [ ] **PAR-02** : La fiche partenaire montre missions, CA généré, montant dû (coûts des réservations)
- [ ] **PAR-03** : L'utilisateur voit les véhicules Monaco et les chauffeurs listés pour les partenaires Monaco
- [ ] **PAR-04** : L'utilisateur peut marquer un paiement partenaire (solder le montant dû)
- [ ] **PAR-05** : L'utilisateur peut filtrer les partenaires par zone géographique

---

## Section 6 — Dossiers

- [ ] **DOS-01** : L'utilisateur voit la liste des dossiers avec statut, entité, client, montant total
- [ ] **DOS-02** : Un dossier affiche toutes ses réservations liées avec total CA et marge
- [ ] **DOS-03** : L'utilisateur peut encaisser un paiement sur un dossier (modal + historique)
- [ ] **DOS-04** : L'utilisateur peut créer une facture groupée depuis un dossier (regrouper plusieurs réservations)
- [ ] **DOS-05** : L'utilisateur peut changer le statut d'un dossier inline
- [ ] **DOS-06** : L'utilisateur voit le récapitulatif financier du dossier (montant total, perçu, restant dû)

---

## Section 7 — Facturation

- [ ] **FAC-01** : L'utilisateur voit la liste avec colonnes crm.html (numéro, client, entité, montant, devise, statut, mode paiement)
- [ ] **FAC-02** : L'utilisateur peut filtrer par statut (draft / sent / paid), entité, date
- [ ] **FAC-03** : Le formulaire permet de lier une facture à une réservation ou un dossier
- [ ] **FAC-04** : L'utilisateur peut générer le PDF d'une facture (route /api/pdf/facture/[id])
- [ ] **FAC-05** : L'utilisateur peut envoyer la facture par email via Brevo
- [ ] **FAC-06** : L'utilisateur peut changer le statut d'une facture inline (draft → sent → paid)
- [ ] **FAC-07** : Le numéro de facture est auto-généré par entité et par année (format PREFIX-YYYY-NNN)

---

## Section 8 — Planning

- [ ] **PLA-01** : L'utilisateur voit la vue semaine avec les missions sur un timeline 6h-23h
- [ ] **PLA-02** : L'utilisateur peut basculer entre vue semaine / vue jour / vue mois
- [ ] **PLA-03** : L'utilisateur peut naviguer entre les semaines/jours/mois (précédent / suivant)
- [ ] **PLA-04** : L'utilisateur peut filtrer par chauffeur et par service dans le planning
- [ ] **PLA-05** : Chaque mission dans le planning est cliquable et ouvre le détail de réservation
- [ ] **PLA-06** : Le planning distingue visuellement les services (couleur par type)

---

## Section 9 — Paramètres

- [ ] **PAR-SET-01** : L'utilisateur peut configurer chaque entité (nom, adresse, SIRET, TVA, IBAN, devise, pays)
- [ ] **PAR-SET-02** : L'utilisateur peut activer/désactiver une entité
- [ ] **PAR-SET-03** : L'utilisateur peut configurer les clés API (Airlabs, Google Maps, Stripe)
- [ ] **PAR-SET-04** : L'utilisateur peut configurer les paramètres email Brevo (clé API, envoi auto)
- [ ] **PAR-SET-05** : L'utilisateur peut éditer les templates email (FR/EN, sujet, HTML, preview avec variables)
- [ ] **PAR-SET-06** : Les templates supportent les variables {{prenom}}, {{nom}}, {{service}}, etc.

---

## Future Requirements (hors scope v1.0)

- Recherche globale cross-modules
- App mobile / PWA
- Notifications push
- Intégration agenda Google Calendar
- Multi-utilisateurs avec rôles

## Out of Scope

- Refactoring technique ou architectural
- Changement de stack
- Nouvelles fonctionnalités absentes de crm.html

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DASH-01..06 | Phase 1 | pending |
| RES-01..12 | Phase 2 | pending |
| CLI-01..07 | Phase 3 | pending |
| CHA-01..05 | Phase 4 | pending |
| PAR-01..05 | Phase 5 | pending |
| DOS-01..06 | Phase 6 | pending |
| FAC-01..07 | Phase 7 | pending |
| PLA-01..06 | Phase 8 | pending |
| PAR-SET-01..06 | Phase 9 | pending |
