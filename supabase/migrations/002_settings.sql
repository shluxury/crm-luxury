-- ============================================================
-- 002 - Table settings + migration entite enum -> text
-- ============================================================

-- 1. Table de configuration du CRM
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cle text UNIQUE NOT NULL,
  valeur jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users only" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Données par défaut (entités vides - à configurer dans Paramètres)
INSERT INTO settings (cle, valeur) VALUES
(
  'entites',
  '[
    {
      "id": "entite_1",
      "nom": "",
      "pays": "France",
      "devise": "EUR",
      "adresse": "",
      "cp": "",
      "ville": "",
      "tel": "",
      "email": "",
      "siret": "",
      "tva": "",
      "iban": "",
      "actif": true
    },
    {
      "id": "entite_2",
      "nom": "",
      "pays": "",
      "devise": "EUR",
      "adresse": "",
      "cp": "",
      "ville": "",
      "tel": "",
      "email": "",
      "siret": "",
      "tva": "",
      "iban": "",
      "actif": false
    }
  ]'::jsonb
),
(
  'email',
  '{
    "brevo_key": "",
    "auto_send_client": false,
    "auto_send_chauffeur": false,
    "lang_defaut": "fr"
  }'::jsonb
),
(
  'integrations',
  '{
    "aviationstack_key": "",
    "google_maps_key": "",
    "stripe_secret_key": "",
    "stripe_publishable_key": ""
  }'::jsonb
);

-- 3. Changer la colonne entite : enum -> text dans toutes les tables
ALTER TABLE reservations
  ALTER COLUMN entite TYPE text USING entite::text,
  ALTER COLUMN entite SET DEFAULT 'entite_1';

ALTER TABLE dossiers
  ALTER COLUMN entite TYPE text USING entite::text,
  ALTER COLUMN entite SET DEFAULT 'entite_1';

ALTER TABLE factures
  ALTER COLUMN entite TYPE text USING entite::text,
  ALTER COLUMN entite SET DEFAULT 'entite_1';

-- 4. Migrer les éventuelles anciennes valeurs
UPDATE reservations SET entite = 'entite_1' WHERE entite = 'leader_limousines';
UPDATE reservations SET entite = 'entite_2' WHERE entite = 'leader_concierge_dubai';
UPDATE dossiers    SET entite = 'entite_1' WHERE entite = 'leader_limousines';
UPDATE dossiers    SET entite = 'entite_2' WHERE entite = 'leader_concierge_dubai';
UPDATE factures    SET entite = 'entite_1' WHERE entite = 'leader_limousines';
UPDATE factures    SET entite = 'entite_2' WHERE entite = 'leader_concierge_dubai';

-- 5. Supprimer l'ancien type enum entite
DROP TYPE IF EXISTS entite;
