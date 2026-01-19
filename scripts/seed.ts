import { db, generateId, dateToTimestamp } from '../lib/sqlite';

// Seed the database with sample products and inventory
export function seedDatabase() {
  const now = dateToTimestamp(new Date());

  console.log('🌱 Seeding database...');

  // Create categories
  const categoryId = generateId();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO categories (id, slug, name, parent_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(categoryId, 'electronics', 'Electronics', null, now, now);

  // Sample products
  const products = [
    {
      slug: 'wireless-headphones',
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      variants: [
        { sku: 'WH-BLK-001', title: 'Black', price: 29999, currency: 'usd', stock: 50, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
        { sku: 'WH-WHT-001', title: 'White', price: 29999, currency: 'usd', stock: 30, image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400' },
      ],
    },
    {
      slug: 'smart-watch',
      title: 'Fitness Smart Watch',
      description: 'Track your health and fitness with this advanced smart watch featuring heart rate monitoring and GPS.',
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      variants: [
        { sku: 'SW-BLK-001', title: 'Black Band', price: 19999, currency: 'usd', stock: 75, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
        { sku: 'SW-BLU-001', title: 'Blue Band', price: 19999, currency: 'usd', stock: 60, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400' },
      ],
    },
    {
      slug: 'wireless-keyboard',
      title: 'Mechanical Wireless Keyboard',
      description: 'Premium mechanical keyboard with customizable RGB lighting and wireless connectivity.',
      thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
      variants: [
        { sku: 'KB-BLK-001', title: 'Black', price: 12999, currency: 'usd', stock: 40, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400' },
      ],
    },
    {
      slug: 'usb-c-cable',
      title: 'USB-C Fast Charging Cable',
      description: 'Durable braided USB-C cable with fast charging support up to 100W.',
      thumbnail: 'https://images.unsplash.com/photo-1591290619762-d77cf6f24d78?w=800',
      variants: [
        { sku: 'CBL-1M-001', title: '1 Meter', price: 1499, currency: 'usd', stock: 200, image: 'https://images.unsplash.com/photo-1591290619762-d77cf6f24d78?w=400' },
        { sku: 'CBL-2M-001', title: '2 Meters', price: 1999, currency: 'usd', stock: 150, image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400' },
      ],
    },
    {
      slug: 'laptop-stand',
      title: 'Aluminum Laptop Stand',
      description: 'Ergonomic laptop stand made from premium aluminum with adjustable height.',
      thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
      variants: [
        { sku: 'LS-SLV-001', title: 'Silver', price: 4999, currency: 'usd', stock: 85, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
      ],
    },
  ];

  const productStmt = db.prepare(`
    INSERT OR IGNORE INTO products (id, slug, title, description, thumbnail, active, created_at, updated_at, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const variantStmt = db.prepare(`
    INSERT OR IGNORE INTO product_variants (id, product_id, sku, title, price, currency, image, attributes, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inventoryStmt = db.prepare(`
    INSERT OR IGNORE INTO inventory (id, variant_id, in_stock, reserved, low_stock_level, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    const productId = generateId();
    productStmt.run(
      productId,
      product.slug,
      product.title,
      product.description,
      product.thumbnail,
      1, // active
      now,
      now,
      categoryId
    );

    for (const variant of product.variants) {
      const variantId = generateId();
      variantStmt.run(
        variantId,
        productId,
        variant.sku,
        variant.title,
        variant.price,
        variant.currency,
        variant.image,
        null, // attributes
        1, // active
        now,
        now
      );

      const inventoryId = generateId();
      inventoryStmt.run(
        inventoryId,
        variantId,
        variant.stock,
        0, // reserved
        10, // low_stock_level
        now
      );
    }
  }

  console.log(`✓ Seeded ${products.length} products`);
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
  console.log('✓ Database seeding complete');
  process.exit(0);
}
