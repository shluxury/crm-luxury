// Types Supabase - format compatible avec @supabase/supabase-js v2

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          prenom: string
          nom: string
          tel: string | null
          email: string | null
          nationalite: string | null
          langue: string
          tags: string[]
          entreprise: string | null
          notes: string | null
          is_corporate: boolean
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
          pref_vehicule: string | null
          pref_eau: string | null
          pref_siege_enfant: boolean
          pref_notes_chauffeur: string | null
        }
        Insert: {
          prenom: string
          nom: string
          tel?: string | null
          email?: string | null
          nationalite?: string | null
          langue?: string
          tags?: string[]
          entreprise?: string | null
          notes?: string | null
          is_corporate?: boolean
          corp_nom?: string | null
          corp_adresse?: string | null
          corp_cp?: string | null
          corp_ville?: string | null
          corp_pays?: string | null
          corp_siret?: string | null
          corp_tva?: string | null
          corp_contact_nom?: string | null
          corp_contact_tel?: string | null
          corp_contact_email?: string | null
          pref_vehicule?: string | null
          pref_eau?: string | null
          pref_siege_enfant?: boolean
          pref_notes_chauffeur?: string | null
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: []
      }
      chauffeurs: {
        Row: {
          id: string
          created_at: string
          nom: string
          tel: string | null
          email: string | null
          statut: string
          langues: string[]
          numero_vtc: string | null
        }
        Insert: {
          nom: string
          tel?: string | null
          email?: string | null
          statut?: string
          langues?: string[]
          numero_vtc?: string | null
        }
        Update: Partial<Database['public']['Tables']['chauffeurs']['Insert']>
        Relationships: []
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
        Insert: {
          nom: string
          contact?: string | null
          tel?: string | null
          email?: string | null
          zone?: string | null
          siret?: string | null
          tva?: string | null
          forme_juridique?: string | null
          iban?: string | null
          adresse?: string | null
          cp?: string | null
          ville?: string | null
          pays?: string | null
          notes?: string | null
          has_monaco?: boolean
          mc_vehicules?: string[]
          chauffeurs_list?: string[]
        }
        Update: Partial<Database['public']['Tables']['partenaires']['Insert']>
        Relationships: []
      }
      dossiers: {
        Row: {
          id: string
          created_at: string
          nom: string
          client_id: string | null
          entite: string
          statut: string
          notes: string | null
          montant_percu: number
        }
        Insert: {
          nom: string
          client_id?: string | null
          entite?: string
          statut?: string
          notes?: string | null
          montant_percu?: number
        }
        Update: Partial<Database['public']['Tables']['dossiers']['Insert']>
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          created_at: string
          service: string
          entite: string
          date: string
          heure: string
          client_id: string | null
          chauffeur_id: string | null
          partenaire_id: string | null
          depart: string | null
          destination: string | null
          stops: string[]
          pax: number
          bagages: number
          vehicule: string | null
          num_vol: string | null
          flight_info: Json | null
          montant: number
          cout: number
          currency: string
          mode_paiement: string | null
          repercuter_frais: boolean
          taux_frais_client: number
          montant_percu: number
          statut: string
          fact_statut: string
          dossier_id: string | null
          ref_partenaire: string | null
          nb_heures: number | null
          resto: string | null
          couverts: number | null
          occasion: string | null
          allergies: string | null
          demandes_resto: string | null
          mad_itinerary: string | null
          wait_hours: number | null
          wait_rate: number | null
          notes: string | null
          cancel_reason: string | null
          extras: Json | null
          pricing_mode: string | null
          montant_vol: number | null
          comm_taux: number | null
        }
        Insert: {
          service: string
          entite?: string
          date: string
          heure: string
          client_id?: string | null
          chauffeur_id?: string | null
          partenaire_id?: string | null
          depart?: string | null
          destination?: string | null
          stops?: string[]
          pax?: number
          bagages?: number
          vehicule?: string | null
          num_vol?: string | null
          flight_info?: Json | null
          montant?: number
          cout?: number
          currency?: string
          mode_paiement?: string | null
          repercuter_frais?: boolean
          taux_frais_client?: number
          montant_percu?: number
          statut?: string
          fact_statut?: string
          dossier_id?: string | null
          ref_partenaire?: string | null
          nb_heures?: number | null
          resto?: string | null
          couverts?: number | null
          occasion?: string | null
          allergies?: string | null
          demandes_resto?: string | null
          mad_itinerary?: string | null
          wait_hours?: number | null
          wait_rate?: number | null
          notes?: string | null
          cancel_reason?: string | null
          extras?: Json | null
          pricing_mode?: string | null
          montant_vol?: number | null
          comm_taux?: number | null
        }
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>
        Relationships: []
      }
      factures: {
        Row: {
          id: string
          created_at: string
          numero: string
          client_id: string | null
          entite: string
          montant: number
          currency: string
          mode_paiement: string | null
          statut: string
          notes: string | null
          reservation_id: string | null
          dossier_id: string | null
        }
        Insert: {
          numero: string
          client_id?: string | null
          entite?: string
          montant?: number
          currency?: string
          mode_paiement?: string | null
          statut?: string
          notes?: string | null
          reservation_id?: string | null
          dossier_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['factures']['Insert']>
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          cle: string
          valeur: Json
          updated_at: string
        }
        Insert: {
          cle: string
          valeur: Json
        }
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Row types raccourcis
export type Client = Database['public']['Tables']['clients']['Row']
export type Chauffeur = Database['public']['Tables']['chauffeurs']['Row']
export type Partenaire = Database['public']['Tables']['partenaires']['Row']
export type Dossier = Database['public']['Tables']['dossiers']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type Facture = Database['public']['Tables']['factures']['Row']

// Enums métier
export type ServiceType = 'transfert_aeroport' | 'transfert_simple' | 'mise_a_disposition' | 'helicoptere' | 'jet_prive' | 'restaurant' | 'location_voiture'
export type Entite = string  // dynamique, configuré dans Paramètres
export type Currency = 'EUR' | 'USD' | 'AED' | 'GBP'
export type StatutReservation = 'devis' | 'confirmed' | 'paid' | 'part_paid' | 'completed' | 'cancelled'
export type StatutFacture = 'draft' | 'sent' | 'paid'

// Settings — configuration du CRM
export interface EntiteConfig {
  id: string
  nom: string
  pays: string
  devise: Currency
  adresse: string
  cp: string
  ville: string
  tel: string
  email: string
  siret: string
  tva: string
  iban: string
  actif: boolean
}

export interface EmailTemplateContent {
  subject: string
  html: string
}

export interface EmailTemplateByLang {
  fr?: EmailTemplateContent
  en?: EmailTemplateContent
}

export interface AppSettings {
  entites: EntiteConfig[]
  email: {
    brevo_key: string
    auto_send_client: boolean
    auto_send_chauffeur: boolean
    lang_defaut: string
  }
  integrations: {
    airlabs_key: string
    google_maps_key: string
    stripe_secret_key: string
    stripe_publishable_key: string
  }
  // Structure : email_templates[entiteId_ou_global][templateId][lang]
  email_templates: {
    [entiteOrGlobal: string]: {
      [templateId: string]: EmailTemplateByLang
    }
  }
  localisation: {
    lang_crm: string
    lang_emails: string
    lang_factures: string
    devise_defaut: Currency
    timezone: string
  }
}
