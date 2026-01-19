import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET() {
  const products = await dbHelpers.findProducts({
    active: true,
    include: { variants: { where: { active: true }, include: { inventory: true } } },
  });
  return NextResponse.json({ products });
}
