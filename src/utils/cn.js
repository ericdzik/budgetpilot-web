import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitaire pour combiner des classes Tailwind sans conflits
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
