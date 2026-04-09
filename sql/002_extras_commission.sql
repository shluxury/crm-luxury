-- Migration 002 : Extras + Mode commission sur les réservations
-- À exécuter dans Supabase SQL Editor

-- Extras de mission (panier repas, extras libres)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extras jsonb DEFAULT '[]'::jsonb;

-- Mode de pricing (marge classique vs commission héli/jet)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'marge';

-- Pour le mode commission : prix total du vol (payé à l'opérateur)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS montant_vol numeric(12,2) DEFAULT 0;

-- Taux de commission en décimal (ex: 0.10 = 10%)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS comm_taux numeric(6,4) DEFAULT 0;
