import { NextResponse } from 'next/server';
import { getPersonas } from '@/lib/openai';
import { Persona } from '@/types/dashboard';

// Convert personas from openai.ts to dashboard format
function convertToPersonaFormat() {
  const openaiPersonas = getPersonas();
  return openaiPersonas.map(p => ({
    id: p.id,
    name: p.name,
    description: getPersonaDescription(p.id),
    emoji: p.emoji,
  }));
}

function getPersonaDescription(id: string): string {
  switch (id) {
    case 'sat_coach':
      return 'High school test preparation specialist focusing on SAT success strategies';
    case 'gre_master':
      return 'Graduate school preparation expert for GRE success and academic advancement';
    case 'gmat_pro':
      return 'MBA preparation specialist for GMAT and business school applications';
    default:
      return 'Educational content specialist';
  }
}

const PERSONAS: Persona[] = convertToPersonaFormat();

export async function GET() {
  return NextResponse.json({
    success: true,
    personas: PERSONAS,
    count: PERSONAS.length,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}