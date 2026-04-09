// Types générés depuis le schéma Supabase
// Commande : npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      reservations: {
        Row: {
          id: string
          created_at: string
          service: ServiceType
          entite: Entite
          date: string
          heure: string
          client_id: string
          chauffeur_id: string | null
          partenaire_id: string | null
          depart: string
          destination: string
          stops: string[]
          pax: number
          bagages: number
          vehicule: string | null
          num_vol: string | null
          flight_info: Json | null
          montant: number
          cout: number
          currency: Currency
          mode_paiement: ModePaiement | null
          repercuter_frais: boolean
          taux_frais_client: number
          montant_percu: number
          statut: StatutReservation
          fact_statut: StatutFacture
          dossier_id: string | null
          ref_partenaire: string | null
          // Spécifique hélico/jet
          nb_heures: number | null
          // Spécifique restaurant
          resto: string | null
          couverts: number | null
          occasion: string | null
          allergies: string | null
          demandes_resto: string | null
          // Spécifique MAD
          mad_itinerary: string | null
          wait_hours: number | null
          wait_rate: number | null
          notes: string | null
          cancel_reason: string | null
        }
        Insert: Omit<Database['public']['Tables']['reservations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>
      }
      clients: {
        Row: {
          id: string
          created_at: string
          prenom: string
          nom: string
          tel: string | null
          email: string | null
          nationalite: string | null
          langue: 'fr' | 'en'
          tags: string[]
          entreprise: string | null
          notes: string | null
          is_corporate: boolean
          // Corporate
          corp_nom: string | null
          corp_adresse: string | null
          corp_cp: string | null
          corp_ville: string | null
          corp_pays: string | null
          corp_siret: string | null
          corp_tva: string | null
          corp_contact_nom: string | null
          corp_contact_tel: string | null
          corp_contact_email: string | null
          // Préférences
          pref_vehicule: string | null
          pref_eau: string | null
          pref_siege_enfant: boolean
          pref_notes_chauffeur: string | null
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      chauffeurs: {
        Row: {
          id: string
          created_at: string
          nom: string
          tel: string | null
          email: string | null
          statut: 'disponible' | 'indisponible' | 'en_mission'
          langues: string[]
          numero_vtc: string | null
        }
        Insert: Omit<Database['public']['Tables']['chauffeurs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chauffeurs']['Insert']>
      }
      partenaires: {
        Row: {
          id: string
          created_at: string
          nom: string
          contact: string | null
          tel: string | null
          email: string | null
          zone: string | null
          siret: string | null
          tva: string | null
          forme_juridique: string | null
          iban: string | null
          adresse: string | null
          cp: string | null
          ville: string | null
          pays: string | null
          notes: string | null
          has_monaco: boolean
          mc_vehicules: string[]
          chauffeurs_list: string[]
        }
        Insert: Omit<Database['public']['Tables']['partenaires']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['partenaires']['Insert']>
      }
      dossiers: {
        Row: {
          id: string
          created_at: string
          nom: string
          client_id: string
          entite: Entite
          statut: 'ouvert' | 'cloture'
          notes: string | null
          montant_percu: number
        }
        Insert: Omit<Database['public']['Tables']['dossiers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['dossiers']['Insert']>
      }
      factures: {
        Row: {
          id: string
          created_at: string
          numero: string
          client_id: string
          entite: Entite
          montant: number
          currency: Currency
          mode_paiement: ModePaiement | null
          statut: StatutFacture
          notes: string | null
          reservation_id: string | null
          dossier_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['factures']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['factures']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// --- Enums métier ---

export type ServiceType =
  | 'transfert_aeroport'
  | 'transfert_simple'
  | 'mise_a_disposition'
  | 'helicoptere'
  | 'jet_prive'
  | 'restaurant'
  | 'location_voiture'

export type Entite = 'leader_limousines' | 'leader_concierge_dubai'

export type Currency = 'EUR' | 'USD' | 'AED' | 'GBP'

export type ModePaiement =
  | 'sumup'
  | 'stripe'
  | 'tpe'
  | 'virement_fr'
  | 'virement_dubai'
  | 'especes'
  | 'currenxie_us_usd'
  | 'currenxie_uk_eur'
  | 'currenxie_hk_hkd'
  | 'currenxie_hk_eur'

export type StatutReservation =
  | 'devis'
  | 'confirmed'
  | 'paid'
  | 'part_paid'
  | 'completed'
  | 'cancelled'

export type StatutFacture = 'draft' | 'sent' | 'paid'

// --- Row types raccourcis ---

export type Reservation = Database['public']['Tables']['reservations']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Chauffeur = Database['public']['Tables']['chauffeurs']['Row']
export type Partenaire = Database['public']['Tables']['partenaires']['Row']
export type Dossier = Database['public']['Tables']['dossiers']['Row']
export type Facture = Database['public']['Tables']['factures']['Row']
