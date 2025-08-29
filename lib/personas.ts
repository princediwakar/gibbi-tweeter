/**
 * Advanced NEET Persona System with Chapter-Level Granularity
 * Based on official NEET syllabus for maximum content variety and viral potential
 */

// Represents a topic/chapter in the persona hierarchy
interface PersonaTopic {
  key: string;
  displayName: string;
}

// Defines the structure for personas with detailed topic breakdown
export interface PersonaConfig {
  key: string;
  displayName: string;
  emoji: string;
  description: string;
  viralFocus: string;
  topics: PersonaTopic[];
  schedule: {
    generateAt: number[];  // Hours when this persona generates content (IST)
    postAt: number[];      // Hours when this persona posts content (IST)
    weight: number;        // Relative weight for content distribution
  };
}

export const NEET_PHYSICS: PersonaConfig = {
  key: 'neet_physics',
  displayName: 'NEET Physics',
  emoji: '⚛️',
  description: 'Mind-bending NEET physics problems that 90% get wrong',
  viralFocus: 'Physics traps, mechanics nightmares, electromagnetic challenges, thermodynamics brain teasers',
  topics: [
    // Class XI
    { key: 'physics_units_measurements', displayName: 'Units and Measurements' },
    { key: 'physics_motion_straight_line', displayName: 'Motion in a Straight Line' },
    { key: 'physics_motion_plane', displayName: 'Motion in a Plane' },
    { key: 'physics_laws_of_motion', displayName: 'Laws of Motion' },
    { key: 'physics_work_energy_power', displayName: 'Work, Energy, and Power' },
    { key: 'physics_system_particles_rotation', displayName: 'System of Particles & Rotational Motion' },
    { key: 'physics_gravitation', displayName: 'Gravitation' },
    { key: 'physics_mechanical_solids', displayName: 'Mechanical Properties of Solids' },
    { key: 'physics_mechanical_fluids', displayName: 'Mechanical Properties of Fluids' },
    { key: 'physics_thermal_properties', displayName: 'Thermal Properties of Matter' },
    { key: 'physics_thermodynamics', displayName: 'Thermodynamics' },
    { key: 'physics_kinetic_theory', displayName: 'Kinetic Theory' },
    { key: 'physics_oscillations', displayName: 'Oscillations' },
    { key: 'physics_waves', displayName: 'Waves' },
    // Class XII
    { key: 'physics_electric_charges_fields', displayName: 'Electric Charges and Fields' },
    { key: 'physics_electrostatic_potential', displayName: 'Electrostatic Potential and Capacitance' },
    { key: 'physics_current_electricity', displayName: 'Current Electricity' },
    { key: 'physics_moving_charges_magnetism', displayName: 'Moving Charges and Magnetism' },
    { key: 'physics_magnetism_matter', displayName: 'Magnetism and Matter' },
    { key: 'physics_emi', displayName: 'Electromagnetic Induction' },
    { key: 'physics_ac', displayName: 'Alternating Current' },
    { key: 'physics_em_waves', displayName: 'Electromagnetic Waves' },
    { key: 'physics_ray_optics', displayName: 'Ray Optics and Optical Instruments' },
    { key: 'physics_wave_optics', displayName: 'Wave Optics' },
    { key: 'physics_dual_nature', displayName: 'Dual Nature of Radiation and Matter' },
    { key: 'physics_atoms', displayName: 'Atoms' },
    { key: 'physics_nuclei', displayName: 'Nuclei' },
    { key: 'physics_semiconductor_electronics', displayName: 'Semiconductor Electronics' },
  ],
  schedule: {
    generateAt: [10, 20],  // 10 AM, 8 PM IST
    postAt: [16, 22],      // 4 PM, 10 PM IST  
    weight: 0.2           // 20% of content (NEET weightage)
  }
};

export const NEET_CHEMISTRY: PersonaConfig = {
  key: 'neet_chemistry',
  displayName: 'NEET Chemistry',
  emoji: '🧪',
  description: 'Diabolical chemistry traps that destroy 95% of aspirants',
  viralFocus: 'Organic nightmares, reaction mechanism puzzles, periodic table destroyers, bonding hell',
  topics: [
    // Class XI
    { key: 'chem_basic_concepts', displayName: 'Some Basic Concepts of Chemistry' },
    { key: 'chem_structure_atom', displayName: 'Structure of Atom' },
    { key: 'chem_periodicity', displayName: 'Classification of Elements and Periodicity' },
    { key: 'chem_bonding', displayName: 'Chemical Bonding and Molecular Structure' },
    { key: 'chem_states_matter', displayName: 'States of Matter' },
    { key: 'chem_thermodynamics', displayName: 'Thermodynamics' },
    { key: 'chem_equilibrium', displayName: 'Equilibrium' },
    { key: 'chem_redox', displayName: 'Redox Reactions' },
    { key: 'chem_hydrogen', displayName: 'Hydrogen' },
    { key: 'chem_s_block', displayName: 'The s-Block Elements' },
    { key: 'chem_p_block_11', displayName: 'Some p-Block Elements (Class 11)' },
    { key: 'chem_goc', displayName: 'Organic Chemistry: Basic Principles & Techniques' },
    { key: 'chem_hydrocarbons', displayName: 'Hydrocarbons' },
    { key: 'chem_environmental', displayName: 'Environmental Chemistry' },
    // Class XII
    { key: 'chem_solid_state', displayName: 'The Solid State' },
    { key: 'chem_solutions', displayName: 'Solutions' },
    { key: 'chem_electrochemistry', displayName: 'Electrochemistry' },
    { key: 'chem_kinetics', displayName: 'Chemical Kinetics' },
    { key: 'chem_surface', displayName: 'Surface Chemistry' },
    { key: 'chem_metallurgy', displayName: 'General Principles of Isolation of Elements' },
    { key: 'chem_p_block_12', displayName: 'The p-Block Elements (Class 12)' },
    { key: 'chem_d_f_block', displayName: 'The d- and f-Block Elements' },
    { key: 'chem_coordination', displayName: 'Coordination Compounds' },
    { key: 'chem_haloalkanes', displayName: 'Haloalkanes and Haloarenes' },
    { key: 'chem_alcohols', displayName: 'Alcohols, Phenols and Ethers' },
    { key: 'chem_aldehydes_ketones', displayName: 'Aldehydes, Ketones, and Carboxylic Acids' },
    { key: 'chem_amines', displayName: 'Organic Compounds Containing Nitrogen (Amines)' },
    { key: 'chem_biomolecules', displayName: 'Biomolecules' },
    { key: 'chem_polymers', displayName: 'Polymers' },
    { key: 'chem_everyday_life', displayName: 'Chemistry in Everyday Life' },
  ],
  schedule: {
    generateAt: [6, 14],   // 6 AM, 2 PM IST
    postAt: [12, 18],      // 12 PM, 6 PM IST
    weight: 0.2           // 20% of content (NEET weightage)
  }
};

export const NEET_BIOLOGY: PersonaConfig = {
  key: 'neet_biology',
  displayName: 'NEET Biology',
  emoji: '🧬',
  description: 'Brutal biology challenges that separate AIIMS material from the rest',
  viralFocus: 'Physiology nightmares, genetics death traps, ecology reasoning hell, medical pressure tests',
  topics: [
    // Class XI
    { key: 'bio_living_world', displayName: 'The Living World' },
    { key: 'bio_biological_classification', displayName: 'Biological Classification' },
    { key: 'bio_plant_kingdom', displayName: 'Plant Kingdom' },
    { key: 'bio_animal_kingdom', displayName: 'Animal Kingdom' },
    { key: 'bio_morphology_plants', displayName: 'Morphology of Flowering Plants' },
    { key: 'bio_anatomy_plants', displayName: 'Anatomy of Flowering Plants' },
    { key: 'bio_structural_organisation_animals', displayName: 'Structural Organisation in Animals' },
    { key: 'bio_cell_unit_life', displayName: 'Cell: The Unit of Life' },
    { key: 'bio_biomolecules', displayName: 'Biomolecules (Biology)' },
    { key: 'bio_cell_cycle', displayName: 'Cell Cycle and Cell Division' },
    { key: 'bio_transport_plants', displayName: 'Transport in Plants' },
    { key: 'bio_mineral_nutrition', displayName: 'Mineral Nutrition' },
    { key: 'bio_photosynthesis', displayName: 'Photosynthesis in Higher Plants' },
    { key: 'bio_respiration_plants', displayName: 'Respiration in Plants' },
    { key: 'bio_plant_growth', displayName: 'Plant Growth and Development' },
    { key: 'bio_digestion_absorption', displayName: 'Digestion and Absorption' },
    { key: 'bio_breathing_exchange', displayName: 'Breathing and Exchange of Gases' },
    { key: 'bio_body_fluids_circulation', displayName: 'Body Fluids and Circulation' },
    { key: 'bio_excretory_products', displayName: 'Excretory Products and their Elimination' },
    { key: 'bio_locomotion_movement', displayName: 'Locomotion and Movement' },
    { key: 'bio_neural_control', displayName: 'Neural Control and Coordination' },
    { key: 'bio_chemical_coordination', displayName: 'Chemical Coordination and Integration' },
    // Class XII
    { key: 'bio_reproduction_organisms', displayName: 'Reproduction in Organisms' },
    { key: 'bio_sexual_reproduction_plants', displayName: 'Sexual Reproduction in Flowering Plants' },
    { key: 'bio_human_reproduction', displayName: 'Human Reproduction' },
    { key: 'bio_reproductive_health', displayName: 'Reproductive Health' },
    { key: 'bio_genetics_inheritance', displayName: 'Principles of Inheritance and Variation' },
    { key: 'bio_molecular_inheritance', displayName: 'Molecular Basis of Inheritance' },
    { key: 'bio_evolution', displayName: 'Evolution' },
    { key: 'bio_human_health_disease', displayName: 'Human Health and Disease' },
    { key: 'bio_food_production', displayName: 'Strategies for Enhancement in Food Production' },
    { key: 'bio_microbes_welfare', displayName: 'Microbes in Human Welfare' },
    { key: 'bio_biotech_principles', displayName: 'Biotechnology: Principles and Processes' },
    { key: 'bio_biotech_applications', displayName: 'Biotechnology and its Applications' },
    { key: 'bio_organisms_populations', displayName: 'Organisms and Populations' },
    { key: 'bio_ecosystem', displayName: 'Ecosystem' },
    { key: 'bio_biodiversity_conservation', displayName: 'Biodiversity and Conservation' },
    { key: 'bio_environmental_issues', displayName: 'Environmental Issues' },
  ],
  schedule: {
    generateAt: [2, 8, 17],  // 2 AM, 8 AM, 5 PM IST
    postAt: [7, 13, 20],     // 7 AM, 1 PM, 8 PM IST
    weight: 0.6             // 60% of content (NEET weightage)
  }
};

export const PERSONAS: PersonaConfig[] = [NEET_PHYSICS, NEET_CHEMISTRY, NEET_BIOLOGY] as const;

// Type helpers
export type PersonaKey = typeof PERSONAS[number]['key'];

// Utility functions
export function getPersonaByKey(key: string): PersonaConfig | undefined {
  return PERSONAS.find(p => p.key === key);
}

// Topic selection functions
export function getRandomTopicForPersona(personaKey: string): PersonaTopic | undefined {
  const persona = getPersonaByKey(personaKey);
  if (!persona || persona.topics.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * persona.topics.length);
  return persona.topics[randomIndex];
}

export function getAllTopicsForPersona(personaKey: string): PersonaTopic[] {
  const persona = getPersonaByKey(personaKey);
  return persona ? persona.topics : [];
}


// Content distribution by weight
export function selectPersonaByWeight(): PersonaConfig {
  const totalWeight = PERSONAS.reduce((sum, p) => sum + p.schedule.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const persona of PERSONAS) {
    random -= persona.schedule.weight;
    if (random <= 0) return persona;
  }
  
  return PERSONAS[0]; // Fallback
}

// For legacy compatibility (with key mapping)
export const personas = PERSONAS.map(p => ({
  id: p.key,
  name: p.displayName,
  emoji: p.emoji,
  description: p.description,
  viralFocus: p.viralFocus,
  schedule: p.schedule
}));

export default PERSONAS;