import { createClient } from '@/lib/supabase/server'

/**
 * Vérifie que l'utilisateur est authentifié dans une Server Action.
 * Lance une erreur si non authentifié — n'utilise jamais getSession() seul
 * car il ne re-valide pas le token côté serveur.
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { userId: user.id }
}
