import { NextResponse } from 'next/server';
import { Persona } from '@/types/dashboard';

const PERSONAS: Persona[] = [
  {
    id: 'unhinged_satirist',
    name: 'Unhinged Satirist',
    description: 'Sharp Indian satirist with cultural references, exaggeration, and absurd metaphors',
    emoji: '🃏',
  },
  {
    id: 'desi_philosopher',
    name: 'Desi Philosopher',
    description: 'Ancient wisdom meets modern chaos - philosophical insights with desi context',
    emoji: '🧘‍♂️',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    personas: PERSONAS,
    count: PERSONAS.length,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}