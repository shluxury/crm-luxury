import { redirect } from 'next/navigation'

// La racine redirige vers le dashboard (ou login si non authentifié)
export default function Home() {
  redirect('/dashboard')
}
