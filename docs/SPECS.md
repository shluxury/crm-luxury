# SPECS.md - Spécifications Fonctionnelles CRM Luxury

> Extraites par analyse du CRM de référence. Aucun code n'a été réutilisé.
> Version : 1.0 - Avril 2026

---

## 1. Vue d'ensemble

### 1.1 Contexte métier

CRM interne pour une société de transport et conciergerie de luxe opérant en France et à Dubai. Gère l'ensemble du cycle de vie d'une réservation : de la création jusqu'à la facturation et l'encaissement.

### 1.2 Entités légales

| Entité | Pays | Devise principale |
|--------|------|-------------------|
| Leader Limousines | France | EUR |
| Leader Concierge | Dubai, UAE | AED / USD |

### 1.3 Profil utilisateur

- **Admin** : Accès complet (création, modification, suppression)
- **Guest** : Consultation uniquement (lecture seule)
- Authentification par PIN (4 à 6 chiffres)

---

## 2. Modules Fonctionnels

### 2.1 Dashboard

**Objectif** : Vue synthétique de l'activité en cours.

**Widgets** :
- Encaissements du mois en cours (total par mode de paiement)
- CA partenaires (montants versés aux sous-traitants)
- Montants dus aux partenaires (non encore payés)
- Missions en attente de confirmation chauffeur
- Alertes vols (numéros de vol à confirmer)

**Filtres** :
- Par entité (LL vs LC Dubai)
- Par mois

---

### 2.2 Réservations

**Objectif** : Gestion complète du cycle de vie d'une réservation.

#### 2.2.1 Services disponibles

**Chauffeur :**
| Service | Description |
|---------|-------------|
| Transfert aéroport | Avec numéro de vol, auto-fill infos vol |
| Transfert simple | Point A vers point B |
| Mise à disposition (MAD) | Location à l'heure avec itinéraire |

**Conciergerie :**
| Service | Description |
|---------|-------------|
| Hélicoptère | Transfer hélico (plusieurs appareils) |
| Jet privé | Charter jet (plusieurs avions) |
| Restaurant | Réservation restaurant (couverts, occasion, allergies) |
| Location voiture | Voitures de luxe (Ferrari, Lambo, Bentley, etc.) |

#### 2.2.2 Champs d'une réservation

**Informations de base :**
- Identifiant unique (auto-généré)
- Service (type parmi les 7 ci-dessus)
- Entité (LL ou LC Dubai)
- Date et heure
- Client (lié à la table clients)
- Nombre de passagers + bagages
- Notes internes

**Transport :**
- Départ (adresse avec autocomplete Google Maps)
- Destination (adresse avec autocomplete)
- Arrêts intermédiaires (liste)
- Véhicule assigné
- Chauffeur interne OU partenaire sous-traitant
- Numéro de vol (transferts aéroport)
- Infos vol (compagnie, aéroports, horaires - auto-fill)

**Financier :**
- Montant client (HT ou TTC selon config)
- Coût partenaire (ce qu'on paye au sous-traitant)
- Marge calculée automatiquement
- Devise (EUR, USD, AED, GBP)
- Mode de paiement (voir section 2.2.3)
- Frais Stripe répercutés au client (option)
- Montant perçu (encaissement partiel possible)

**Statuts réservation :**
| Statut | Description |
|--------|-------------|
| `devis` | En attente de validation client |
| `confirmed` | Confirmée, en attente de mission |
| `paid` | Réglée intégralement |
| `part_paid` | Partiellement réglée |
| `completed` | Mission effectuée |
| `cancelled` | Annulée (avec motif) |

**Statuts facturation :**
| Statut | Description |
|--------|-------------|
| `draft` | Brouillon |
| `sent` | Envoyée au client |
| `paid` | Réglée |

#### 2.2.3 Modes de paiement

| Mode | Frais |
|------|-------|
| SumUp | 1,4% |
| Stripe (lien) | 3,5% |
| TPE | 0% |
| Virement France | 0% |
| Virement Dubai | 0% |
| Espèces | 0% |
| Currenxie US (USD) | 0,35% + 0,65€ |
| Currenxie UK (EUR) | 0,35% + 0,05€ |
| Currenxie HK (HKD) | 0,05% + 0,65€ |
| Currenxie HK (EUR) | 0,05% + 7,00€ |

#### 2.2.4 Actions sur une réservation

- Créer / Modifier / Dupliquer / Annuler / Supprimer
- Générer un devis PDF (avec signature électronique)
- Générer une facture PDF
- Envoyer un email (templates prédéfinis)
- Générer un lien de paiement Stripe
- Assigner à un dossier de facturation
- Enregistrer un paiement (total ou partiel)
- Envoyer brief chauffeur par email

---

### 2.3 Clients

**Objectif** : Carnet d'adresses des clients avec historique.

#### 2.3.1 Données client individuel

- Prénom, nom
- Téléphone, email
- Nationalité
- Langue préférée (FR/EN)
- Tags (VIP, corporate, etc.)
- Préférences : véhicule, eau, siège enfant, notes chauffeur
- Historique : nombre de missions, CA total

#### 2.3.2 Données client corporate

En plus des données individuelles :
- Nom de la société
- Adresse complète
- SIRET
- TVA intracommunautaire
- Contact facturation (nom, tel, email)

#### 2.3.3 Actions client

- Créer / Modifier / Supprimer
- Voir l'historique des réservations
- Envoyer un email libre

---

### 2.4 Chauffeurs

**Objectif** : Gestion des chauffeurs internes.

**Données :**
- Nom, téléphone, email
- Statut (disponible, indisponible, en mission)
- Langues parlées
- Numéro carte VTC
- Statistiques : missions du mois

**Actions :**
- Créer / Modifier / Supprimer
- Voir les missions assignées
- Envoyer brief de mission

---

### 2.5 Partenaires

**Objectif** : Gestion des sous-traitants et opérateurs externes.

**Données :**
- Nom, contact, téléphone, email
- Zone géographique
- Informations légales (SIRET, TVA, forme juridique)
- IBAN (pour paiements)
- Tarifs par véhicule
- Chauffeurs associés (liste)
- Flag Monaco (opérateur Monaco)
- Statistiques : missions, CA apporté, montants dus

**Suivi financier :**
- Montant dû du mois
- Montant dû total
- Historique des paiements effectués

**Actions :**
- Créer / Modifier / Supprimer
- Marquer paiement effectué

---

### 2.6 Dossiers

**Objectif** : Regrouper des réservations pour facturation consolidée.

**Cas d'usage** : Client corporate qui passe plusieurs missions sur le mois, facturées en une seule fois.

**Données :**
- Identifiant unique
- Nom du dossier
- Client associé
- Réservations incluses (liste)
- Entité (LL ou LC Dubai)
- Statut (ouvert / clôturé)
- Notes
- Montant total perçu

**Actions :**
- Créer / Modifier / Clôturer
- Ajouter/retirer des réservations
- Générer facture consolidée PDF
- Enregistrer paiement

---

### 2.7 Facturation

**Objectif** : Suivi des factures émises.

**Données :**
- Numéro de facture (séquentiel)
- Client
- Service associé
- Montant et devise
- Mode de paiement
- Entité
- Date
- Statut (draft / sent / paid)
- Notes
- Lien vers réservation ou dossier

**Actions :**
- Voir la liste filtrée
- Modifier le statut
- Prévisualiser PDF
- Envoyer par email

---

### 2.8 Planning

**Objectif** : Vue calendaire des missions.

**Vues :**
- Jour
- Semaine
- Mois

**Filtres :**
- Par chauffeur
- Par partenaire
- Par type de service

**Données affichées par mission :**
- Heure, service, client, chauffeur/partenaire
- Départ - Destination
- Statut (couleur)

---

### 2.9 Emails

**Objectif** : Envoi d'emails transactionnels depuis le CRM.

**Templates disponibles :**

*Chauffeur (transfert/MAD) :*
- Confirmation de réservation
- Devis
- Confirmation de paiement
- Brief chauffeur (fiche de mission)
- Après-prestation
- Email libre

*Conciergerie (hélico/jet/restaurant/voiture) :*
- Confirmation, devis, paiement (par service)

**Fonctionnalités :**
- Multilingue (FR / EN)
- Pré-remplissage automatique depuis la réservation
- Pièces jointes (PDF facture, PDF devis)
- Envoi via Brevo SMTP API

---

### 2.10 Assistant IA

**Objectif** : Assistant conversationnel pour actions rapides dans le CRM.

**Capacités :**
- Créer une réservation par dictée naturelle
- Mettre à jour le statut d'une réservation
- Créer un client
- Naviguer vers une section
- Filtrer des réservations
- Obtenir des statistiques

**Contexte transmis à l'IA :**
- 10 réservations récentes
- 20 derniers clients
- Tous les chauffeurs et partenaires

---

### 2.11 Paramètres

- Langue de l'interface (FR / EN)
- Devise par défaut
- Timezone (Paris, Dubai, London, New York)
- Informations société (nom, adresse, SIRET, TVA, IBAN, logo)
- Configuration par entité (LL vs LC Dubai)
- Notifications automatiques (toggle)

---

## 3. Données Maîtres

### 3.1 Véhicules

**Transfer chauffeur :**
- Mercedes V-Class, S-Class, E-Class
- Range Rover Vogue
- Mercedes Maybach

**Hélicoptères :**
- Airbus H125, H130, AS355, H135, H155
- Bell 429
- Agusta AW109

**Jets :**
- Cessna Citation CJ3
- Pilatus PC-24
- Embraer Phenom 300
- Bombardier Challenger 350
- Gulfstream G550
- Dassault Falcon 2000
- Boeing BBJ

**Location voiture :**
- Ferrari 488, Ferrari Roma
- Lamborghini Huracan
- Porsche 911
- McLaren 720S
- Bentley Continental
- Rolls-Royce Ghost
- Mercedes AMG GT

### 3.2 Devises supportées

EUR, USD, AED, GBP

### 3.3 Langues supportées

Français (FR), Anglais (EN)

---

## 4. Règles Métier

1. La marge d'une réservation = Montant client - Coût partenaire
2. Commission hélicoptère : 10% sur le montant
3. Commission jet privé : 5,5% sur le montant
4. Un dossier peut contenir 0 à N réservations
5. Une réservation ne peut appartenir qu'à 1 dossier max
6. Le statut `paid` ne peut être attribué que si montant_percu >= montant
7. Les emails ne peuvent être envoyés qu'avec un client ayant un email valide
8. Un lien Stripe ne peut être généré que pour les devises EUR, USD, AED, GBP
9. Les frais Stripe répercutés sont configurables par réservation
10. Le numéro de facture est séquentiel et non modifiable une fois assigné

---

## 5. Performances Attendues

- Chargement initial de l'application : < 3 secondes
- Chargement liste réservations (100 items) : < 1 seconde
- Génération PDF : < 5 secondes
- Envoi email : < 3 secondes
- Auto-fill vol (AeroDataBox) : < 5 secondes

---

## 6. Exigences Non-Fonctionnelles

- **Sécurité** : HTTPS obligatoire, RLS sur toutes les tables, pas de secrets côté client
- **RGPD** : Données clients sur serveurs EU (Supabase EU region)
- **Accessibilité** : Interface utilisable sur desktop (Chrome, Firefox, Safari)
- **Responsive** : Support tablette (usage occasionnel)
- **Sauvegarde** : Backup automatique Supabase (daily)
