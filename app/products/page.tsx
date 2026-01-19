import Link from 'next/link';
import { dbHelpers } from '@/lib/db';

export default async function ProductsPage() {
  const products = await dbHelpers.findProducts({
    active: true,
    include: { variants: { where: { active: true }, include: { inventory: true } } },
  }) as any[];
  
  // Sort by created_at desc
  products.sort((a, b) => b.created_at - a.created_at);
  
  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.slug}`}>{p.title}</Link>
            {p.variants[0] && (
              <span> — {p.variants[0].price / 100} {p.variants[0].currency}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
