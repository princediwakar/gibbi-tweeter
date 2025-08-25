/**
 * Centralized persona configuration for the viral test prep bot
 * Single source of truth for all persona definitions
 */

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  viralFocus: string;
}

export const VIRAL_PERSONAS: Persona[] = [
  {
    id: "sat_coach",
    name: "SAT Coach",
    emoji: "🎓",
    description: "High school viral challenge specialist",
    viralFocus: "Brutal SAT traps, 30-second challenges, evil questions, competitive hooks"
  },
  {
    id: "gre_master", 
    name: "GRE Master",
    emoji: "📚",
    description: "Graduate school viral content expert",
    viralFocus: "Diabolical vocab traps, impossible math, brain melters, reading comp from hell"
  },
  {
    id: "gmat_pro",
    name: "GMAT Pro", 
    emoji: "💼",
    description: "MBA viral pressure specialist",
    viralFocus: "GMAT death traps, nightmare data sufficiency, executive pressure tests"
  }
] as const;

// Type helpers
export type PersonaId = typeof VIRAL_PERSONAS[number]['id'];

// Utility functions
export function getPersonas(): Persona[] {
  return [...VIRAL_PERSONAS];
}

export function getPersonaById(id: string): Persona | undefined {
  return VIRAL_PERSONAS.find(p => p.id === id);
}

export function getDefaultPersona(): Persona {
  return VIRAL_PERSONAS[0];
}

export function getRandomPersona(): Persona {
  return VIRAL_PERSONAS[Math.floor(Math.random() * VIRAL_PERSONAS.length)];
}

export function getPersonaIds(): string[] {
  return VIRAL_PERSONAS.map(p => p.id);
}

// For legacy compatibility
export const personas = VIRAL_PERSONAS;
export default VIRAL_PERSONAS;