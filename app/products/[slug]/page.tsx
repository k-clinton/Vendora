import { dbHelpers } from '@/lib/db';

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await dbHelpers.findProductBySlug(params.slug, {
    variants: { where: { active: true }, include: { inventory: true } }
  }) as any;
  
  if (!product) return <div>Not found</div>;
  const v = product.variants[0];
  const available = v?.inventory ? v.inventory.in_stock - v.inventory.reserved : 0;
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      {v && (
        <div>
          <div>Price: {v.price / 100} {v.currency}</div>
          <div>Available: {available}</div>
        </div>
      )}
    </div>
  );
}
