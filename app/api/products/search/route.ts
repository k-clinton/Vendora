import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const inStock = searchParams.get('inStock');

  try {
    let sql = `
      SELECT DISTINCT
        p.id,
        p.slug,
        p.title,
        p.description,
        p.thumbnail,
        p.active,
        p.created_at,
        p.category_id
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE p.active = 1
    `;

    const params: any[] = [];

    // Search query
    if (query) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR pv.title LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      sql += ` AND p.category_id = ?`;
      params.push(category);
    }

    // Price range filter
    if (minPrice) {
      sql += ` AND pv.price >= ?`;
      params.push(parseInt(minPrice));
    }
    if (maxPrice) {
      sql += ` AND pv.price <= ?`;
      params.push(parseInt(maxPrice));
    }

    // In stock filter
    if (inStock === 'true') {
      sql += ` AND (i.in_stock - i.reserved) > 0`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const stmt = db.prepare(sql);
    const products = stmt.all(...params);

    // Get variants for each product
    const productsWithVariants = await Promise.all(
      products.map(async (product: any) => {
        const variants = db
          .prepare(
            `SELECT pv.*, i.in_stock, i.reserved
             FROM product_variants pv
             LEFT JOIN inventory i ON pv.id = i.variant_id
             WHERE pv.product_id = ? AND pv.active = 1`
          )
          .all(product.id);

        return {
          ...product,
          variants,
        };
      })
    );

    return NextResponse.json({ products: productsWithVariants });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
