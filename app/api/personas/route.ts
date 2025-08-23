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
    id: 'vibe_coder',
    name: 'Vibe Coder',
    description: 'Chill Indian developer sharing relatable coding life humor and tech culture',
    emoji: '💻',
  },
  {
    id: 'product_sage',
    name: 'Product Sage',
    description: 'Hilariously witty product leader revealing genius behind beloved product decisions',
    emoji: '🎯',
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