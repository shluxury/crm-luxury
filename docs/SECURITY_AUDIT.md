# SECURITY_AUDIT.md - Audit de Sécurité CRM de Référence

> **DESTINATAIRE : Propriétaire du CRM de référence**
> Ce document liste les credentials exposées dans votre code source CRM.
> Ces clés sont compromises car visibles dans le code JavaScript côté client.
> **ACTION REQUISE : Régénérer toutes ces clés immédiatement.**

Date de l'audit : Avril 2026

---

## 🔴 CRITIQUE - Action immédiate requise

### 1. Clé Supabase (Accès base de données)

**Type** : JWT Anon Key Supabase  
**Risque** : Accès potentiel à toutes les données clients, réservations, factures selon les policies RLS configurées  
**Expiration** : Très longue (2089) - elle ne va pas expirer naturellement  

**Action à faire :**
1. Aller dans [Supabase Dashboard](https://supabase.com/dashboard) > Settings > API
2. Cliquer sur "Reset" pour régénérer les clés
3. Mettre à jour toutes les applications utilisant ces clés

**Vérification complémentaire :**
- Auditer les policies RLS de chaque table
- Vérifier les logs d'accès Supabase pour détecter des accès non autorisés
- S'assurer que le mode `service_role` n'est utilisé nulle part côté client

---

### 2. Clé API Brevo (Service d'envoi d'emails)

**Type** : API Key Brevo (ex-Sendinblue)  
**Risque** : Envoi d'emails massifs au nom de votre domaine, usurpation d'identité, spam, blacklisting de votre domaine  

**Action à faire :**
1. Aller dans [Brevo Dashboard](https://app.brevo.com) > Settings > API Keys
2. Révoquer la clé exposée
3. Générer une nouvelle clé
4. Déplacer cette clé côté serveur (jamais dans du code frontend)

**Vérification complémentaire :**
- Vérifier l'historique des emails envoyés pour détecter des envois anormaux
- Activer les alertes de quota Brevo

---

## 🟠 IMPORTANT

### 3. Clé RapidAPI / AeroDataBox (Informations de vol)

**Type** : RapidAPI Key  
**Risque** : Utilisation de votre quota API par des tiers, factures RapidAPI imprévues  

**Action à faire :**
1. Aller dans [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
2. Régénérer la clé API
3. Configurer une limite de quota mensuelle
4. Déplacer côté serveur

---

### 4. Clé Google Maps API

**Type** : Google Maps JavaScript API Key  
**Risque** : Consommation de votre quota Maps par des tiers, factures Google Cloud  

**Action à faire :**
1. Aller dans [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Credentials
2. Restreindre la clé actuelle aux domaines autorisés uniquement (HTTP referrers)
3. OU régénérer une nouvelle clé déjà restreinte
4. Activer les alertes de budget dans Google Cloud

---

### 5. Clé Publique Stripe (Live Mode)

**Type** : Stripe Publishable Key (live)  
**Note** : Les clés publiques Stripe sont conçues pour être côté client. Cependant :  
**Risque** : Combinée avec votre Worker Cloudflare, permet potentiellement de créer des liens de paiement  

**Action recommandée :**
- Vérifier les logs Stripe pour des créations de liens non autorisées
- Sécuriser le Worker Cloudflare avec une authentification (token secret en header)
- Implémenter un rate limiting sur le Worker

---

## 🟡 RECOMMANDATIONS

### 6. Architecture Frontend-Only

Le CRM actuel est une **Single Page Application sans backend**. Toutes les clés API sont visibles dans le JavaScript du navigateur (DevTools > Sources).

**Recommandation** : Migrer les appels API sensibles vers un backend sécurisé :
- Supabase Edge Functions
- Cloudflare Workers (déjà utilisé pour Stripe)
- Next.js API Routes

### 7. Authentification PIN sans session sécurisée

Le PIN est vérifié côté client uniquement. Si le code JavaScript est accessible, le PIN peut être contourné.

**Recommandation** : Implémenter une vraie authentification via Supabase Auth (email + password, ou magic link).

### 8. Données dans localStorage

Certaines configurations sont stockées dans localStorage du navigateur, non chiffré.

**Recommandation** : Stocker la configuration en base Supabase, pas dans localStorage.

---

## Checklist d'Actions

- [ ] Régénérer la clé Supabase Anon
- [ ] Révoquer et régénérer la clé Brevo
- [ ] Régénérer la clé RapidAPI
- [ ] Restreindre la clé Google Maps aux domaines autorisés
- [ ] Vérifier les logs Stripe pour des créations anormales
- [ ] Sécuriser le Worker Cloudflare avec un token d'authentification
- [ ] Auditer les policies RLS Supabase
- [ ] Vérifier les logs d'accès Brevo pour envois suspects

---

## Note sur notre nouveau CRM

Pour notre implémentation from scratch, nous appliquons dès le départ les bonnes pratiques :
- Clés secrètes uniquement dans des Workers/Edge Functions côté serveur
- Seules les clés publiques (Supabase anon, Stripe publishable, Google Maps) sont côté client
- Authentification via Supabase Auth (pas de PIN côté client)
- RLS stricte sur toutes les tables
