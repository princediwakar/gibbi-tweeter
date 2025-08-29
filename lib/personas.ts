/**
 * Centralized persona configuration for the Gibbi-Tweeter NEET prep bot.
 * This file defines the authoritative personas for all content generation.
 */

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  viralFocus: string;
  sourceFile: string;
  schedule: {
    generateAt: number[];  // Hours when this persona generates content (IST)
    postAt: number[];      // Hours when this persona posts content (IST)
  };
}

export const PHYSICS_MASTER: Persona = {
  id: "physics_master",
  name: "NEET Physics",
  emoji: "⚛️",
  description: "Your go-to source for mind-bending NEET physics problems and concepts.",
  viralFocus: "Challenging MCQs, physics traps, 30-second challenges, and mechanics nightmares.",
  sourceFile: "lib/sources-physics.json",
  schedule: {
    generateAt: [8, 14, 20],    // Generate at 8 AM, 2 PM, 8 PM IST
    postAt: [9, 15, 21]         // Post at 9 AM, 3 PM, 9 PM IST
  }
};

export const CHEMISTRY_GURU: Persona = {
  id: "chemistry_guru",
  name: "NEET Chemistry",
  emoji: "🧪",
  description: "The expert on chemical reactions, organic chemistry, and all things molecules for NEET.",
  viralFocus: "Chemistry traps, 45-second challenges, organic nightmares, and periodic table secrets.",
  sourceFile: "lib/sources-chemistry.json",
  schedule: {
    generateAt: [10, 16, 22],   // Generate at 10 AM, 4 PM, 10 PM IST
    postAt: [11, 17, 23]        // Post at 11 AM, 5 PM, 11 PM IST
  }
};

export const BIOLOGY_PRO: Persona = {
  id: "biology_pro",
  name: "NEET Biology",
  emoji: "🧬",
  description: "The authority on the human body, genetics, and the living world for NEET.",
  viralFocus: "Biology traps, genetics challenges, physiology nightmares, and ecology puzzles.",
  sourceFile: "lib/sources-biology.json",
  schedule: {
    generateAt: [12, 18],       // Generate at 12 PM, 6 PM IST
    postAt: [13, 19]            // Post at 1 PM, 7 PM IST
  }
};

export const PERSONAS: Persona[] = [PHYSICS_MASTER, CHEMISTRY_GURU, BIOLOGY_PRO] as const;

// Type helpers
export type PersonaId = typeof PERSONAS[number]['id'];

// Utility functions
export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find(p => p.id === id);
}

// Persona scheduling functions
export function getAvailablePersonasForGeneration(currentHour: number): Persona[] {
  return PERSONAS.filter(persona => 
    persona.schedule.generateAt.includes(currentHour)
  );
}

export function getAvailablePersonasForPosting(currentHour: number): Persona[] {
  return PERSONAS.filter(persona => 
    persona.schedule.postAt.includes(currentHour)
  );
}

export function isPersonaAvailableForPosting(personaId: string, currentHour: number): boolean {
  const persona = getPersonaById(personaId);
  return persona ? persona.schedule.postAt.includes(currentHour) : false;
}

// For legacy compatibility
export const personas = PERSONAS;
export default PERSONAS;