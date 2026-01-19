import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const product = await dbHelpers.findProductBySlug(params.slug, {
    variants: { where: { active: true }, include: { inventory: true } }
  });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}
