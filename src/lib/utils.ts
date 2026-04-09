import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Palette de couleurs pour les tags
const TAG_PALETTE = [
  { bg: 'rgba(201,168,76,0.15)',  border: 'rgba(201,168,76,0.4)',  color: '#C9A060' }, // or
  { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  color: '#60a5fa' }, // bleu
  { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.4)',   color: '#4ade80' }, // vert
  { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.4)',  color: '#c084fc' }, // violet
  { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)',  color: '#fb923c' }, // orange
  { bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.4)',  color: '#f472b6' }, // rose
  { bg: 'rgba(20,184,166,0.15)',  border: 'rgba(20,184,166,0.4)',  color: '#2dd4bf' }, // teal
  { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   color: '#f87171' }, // rouge
  { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.4)',   color: '#facc15' }, // jaune
  { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)',  color: '#818cf8' }, // indigo
]

// Couleurs fixes pour les tags connus
const TAG_KNOWN: Record<string, number> = {
  'VIP': 0,
  'Corporate': 1,
  'Régulier': 2,
  'Fidèle': 2,
  'Famille': 5,
  'Yacht': 6,
  'Nouvelle connaissance': 9,
}

export function getTagColor(tag: string): { bg: string; border: string; color: string } {
  const upper = tag.toUpperCase()
  if (TAG_KNOWN[tag] !== undefined) return TAG_PALETTE[TAG_KNOWN[tag]]
  // Hash du nom pour attribution déterministe
  let hash = 0
  for (let i = 0; i < upper.length; i++) {
    hash = (hash * 31 + upper.charCodeAt(i)) % TAG_PALETTE.length
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]
}
