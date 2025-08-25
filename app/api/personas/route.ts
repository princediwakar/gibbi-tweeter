import { NextResponse } from 'next/server';
import { getPersonas } from '@/lib/personas';
import { Persona } from '@/types/dashboard';

// Use centralized personas directly
const PERSONAS: Persona[] = getPersonas();

export async function GET() {
  return NextResponse.json({
    success: true,
    personas: PERSONAS,
    count: PERSONAS.length,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}