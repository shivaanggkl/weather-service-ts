import type { TempCategory } from '../types.js';

/**
 * Simple temperature categorization in Fahrenheit.
 * Adjust thresholds at will.
 */
export function categorizeTempF(tempF: number): TempCategory {
  if (tempF >= 85) return 'hot';
  if (tempF <= 45) return 'cold';
  return 'moderate';
}
