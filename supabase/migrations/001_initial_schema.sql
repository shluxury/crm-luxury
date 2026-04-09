-- ============================================================
-- CRM Luxury - Schéma initial
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type service_type as enum (
  'transfert_aeroport',
  'transfert_simple',
  'mise_a_disposition',
  'helicoptere',
  'jet_prive',
  'restaurant',
  'location_voiture'
);

create type entite as enum (
  'leader_limousines',
  'leader_concierge_dubai'
);

create type currency as enum ('EUR', 'USD', 'AED', 'GBP');

create type mode_paiement as enum (
  'sumup',
  'stripe',
  'tpe',
  'virement_fr',
  'virement_dubai',
  'especes',
  'currenxie_us_usd',
  'currenxie_uk_eur',
  'currenxie_hk_hkd',
  'currenxie_hk_eur'
);

create type statut_reservation as enum (
  'devis',
  'confirmed',
  'paid',
  'part_paid',
  'completed',
  'cancelled'
);

create type statut_facture as enum ('draft', 'sent', 'paid');

-- ============================================================
-- CLIENTS
-- ============================================================

create table clients (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  prenom text not null,
  nom text not null,
  tel text,
  email text,
  nationalite text,
  langue text default 'fr' check (langue in ('fr', 'en')),
  tags text[] default '{}',
  entreprise text,
  notes text,
  is_corporate boolean default false,
  -- Corporate
  corp_nom text,
  corp_adresse text,
  corp_cp text,
  corp_ville text,
  corp_pays text,
  corp_siret text,
  corp_tva text,
  corp_contact_nom text,
  corp_contact_tel text,
  corp_contact_email text,
  -- Préférences
  pref_vehicule text,
  pref_eau text,
  pref_siege_enfant boolean default false,
  pref_notes_chauffeur text
);

-- ============================================================
-- CHAUFFEURS
-- ============================================================

create table chauffeurs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  nom text not null,
  tel text,
  email text,
  statut text default 'disponible' check (statut in ('disponible', 'indisponible', 'en_mission')),
  langues text[] default '{}',
  numero_vtc text
);

-- ============================================================
-- PARTENAIRES
-- ============================================================

create table partenaires (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  nom text not null,
  contact text,
  tel text,
  email text,
  zone text,
  siret text,
  tva text,
  forme_juridique text,
  iban text,
  adresse text,
  cp text,
  ville text,
  pays text,
  notes text,
  has_monaco boolean default false,
  mc_vehicules text[] default '{}',
  chauffeurs_list text[] default '{}'
);

-- ============================================================
-- DOSSIERS
-- ============================================================

create table dossiers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  nom text not null,
  client_id uuid references clients(id) on delete set null,
  entite entite not null default 'leader_limousines',
  statut text default 'ouvert' check (statut in ('ouvert', 'cloture')),
  notes text,
  montant_percu numeric(10,2) default 0
);

-- ============================================================
-- RESERVATIONS
-- ============================================================

create table reservations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  service service_type not null,
  entite entite not null default 'leader_limousines',
  date date not null,
  heure time not null,
  client_id uuid references clients(id) on delete set null,
  chauffeur_id uuid references chauffeurs(id) on delete set null,
  partenaire_id uuid references partenaires(id) on delete set null,
  depart text,
  destination text,
  stops text[] default '{}',
  pax integer default 1,
  bagages integer default 0,
  vehicule text,
  num_vol text,
  flight_info jsonb,
  montant numeric(10,2) default 0,
  cout numeric(10,2) default 0,
  currency currency default 'EUR',
  mode_paiement mode_paiement,
  repercuter_frais boolean default false,
  taux_frais_client numeric(5,4) default 0,
  montant_percu numeric(10,2) default 0,
  statut statut_reservation default 'devis',
  fact_statut statut_facture default 'draft',
  dossier_id uuid references dossiers(id) on delete set null,
  ref_partenaire text,
  -- Hélico / Jet
  nb_heures numeric(5,2),
  -- Restaurant
  resto text,
  couverts integer,
  occasion text,
  allergies text,
  demandes_resto text,
  -- MAD
  mad_itinerary text,
  wait_hours numeric(5,2),
  wait_rate numeric(10,2),
  notes text,
  cancel_reason text
);

-- ============================================================
-- FACTURES
-- ============================================================

create table factures (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  numero text unique not null,
  client_id uuid references clients(id) on delete set null,
  entite entite not null default 'leader_limousines',
  montant numeric(10,2) default 0,
  currency currency default 'EUR',
  mode_paiement mode_paiement,
  statut statut_facture default 'draft',
  notes text,
  reservation_id uuid references reservations(id) on delete set null,
  dossier_id uuid references dossiers(id) on delete set null
);

-- ============================================================
-- INDEX (performance)
-- ============================================================

create index reservations_date_idx on reservations(date);
create index reservations_client_idx on reservations(client_id);
create index reservations_statut_idx on reservations(statut);
create index reservations_entite_idx on reservations(entite);
create index clients_nom_idx on clients(nom);
create index factures_client_idx on factures(client_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table clients enable row level security;
alter table chauffeurs enable row level security;
alter table partenaires enable row level security;
alter table dossiers enable row level security;
alter table reservations enable row level security;
alter table factures enable row level security;

-- Politique : accès uniquement aux utilisateurs authentifiés
create policy "Authenticated users only" on clients
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users only" on chauffeurs
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users only" on partenaires
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users only" on dossiers
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users only" on reservations
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users only" on factures
  for all using (auth.role() = 'authenticated');
