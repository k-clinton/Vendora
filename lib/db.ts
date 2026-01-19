import { db, generateId, dateToTimestamp, timestampToDate } from './sqlite';

// Database helper functions for querying
export const dbHelpers = {
  // Product helpers
  async findProducts(options: { active?: boolean; include?: any } = {}) {
    const query = options.active !== undefined 
      ? db.prepare('SELECT * FROM products WHERE active = ?')
      : db.prepare('SELECT * FROM products');
    
    const products = options.active !== undefined 
      ? query.all(options.active ? 1 : 0)
      : query.all();

    if (options.include?.variants) {
      for (const product of products as any[]) {
        const variantsQuery = options.include.variants.where?.active !== undefined
          ? db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND active = ?')
          : db.prepare('SELECT * FROM product_variants WHERE product_id = ?');
        
        product.variants = options.include.variants.where?.active !== undefined
          ? variantsQuery.all(product.id, 1)
          : variantsQuery.all(product.id);

        if (options.include.variants.include?.inventory) {
          for (const variant of product.variants) {
            const invQuery = db.prepare('SELECT * FROM inventory WHERE variant_id = ?');
            variant.inventory = invQuery.get(variant.id);
          }
        }
      }
    }

    return products;
  },

  async findProductBySlug(slug: string, include?: any) {
    const query = db.prepare('SELECT * FROM products WHERE slug = ?');
    const product = query.get(slug) as any;

    if (!product) return null;

    if (include?.variants) {
      const variantsQuery = include.variants.where?.active !== undefined
        ? db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND active = ?')
        : db.prepare('SELECT * FROM product_variants WHERE product_id = ?');
      
      product.variants = include.variants.where?.active !== undefined
        ? variantsQuery.all(product.id, 1)
        : variantsQuery.all(product.id);

      if (include.variants.include?.inventory) {
        for (const variant of product.variants) {
          const invQuery = db.prepare('SELECT * FROM inventory WHERE variant_id = ?');
          variant.inventory = invQuery.get(variant.id);
        }
      }
    }

    return product;
  },

  async findProductVariants(ids: string[], include?: any) {
    const placeholders = ids.map(() => '?').join(',');
    const query = db.prepare(`SELECT * FROM product_variants WHERE id IN (${placeholders}) AND active = 1`);
    const variants = query.all(...ids) as any[];

    if (include?.inventory) {
      for (const variant of variants) {
        const invQuery = db.prepare('SELECT * FROM inventory WHERE variant_id = ?');
        variant.inventory = invQuery.get(variant.id);
      }
    }

    return variants;
  },

  // Inventory helpers
  async findInventory(variantId: string) {
    const query = db.prepare('SELECT * FROM inventory WHERE variant_id = ?');
    return query.get(variantId);
  },

  async updateInventory(variantId: string, updates: { reserved?: number; inStock?: number }) {
    const parts: string[] = [];
    const values: any[] = [];

    if (updates.reserved !== undefined) {
      parts.push('reserved = reserved + ?');
      values.push(updates.reserved);
    }
    if (updates.inStock !== undefined) {
      parts.push('in_stock = in_stock + ?');
      values.push(updates.inStock);
    }

    if (parts.length === 0) return;

    parts.push('updated_at = ?');
    values.push(dateToTimestamp(new Date()));
    values.push(variantId);

    const query = db.prepare(`UPDATE inventory SET ${parts.join(', ')} WHERE variant_id = ?`);
    query.run(...values);
  },

  // Reservation helpers
  async createReservation(data: {
    variantId: string;
    quantity: number;
    paymentIntentId: string;
    expiresAt: Date;
    status: string;
  }) {
    const id = generateId();
    const query = db.prepare(`
      INSERT INTO reservations (id, variant_id, quantity, payment_intent_id, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    query.run(
      id,
      data.variantId,
      data.quantity,
      data.paymentIntentId,
      dateToTimestamp(data.expiresAt),
      data.status,
      dateToTimestamp(new Date())
    );

    return { id, ...data };
  },

  async findReservations(where: { paymentIntentId?: string; status?: string }) {
    if (where.paymentIntentId && where.status) {
      const query = db.prepare('SELECT * FROM reservations WHERE payment_intent_id = ? AND status = ?');
      return query.all(where.paymentIntentId, where.status);
    } else if (where.paymentIntentId) {
      const query = db.prepare('SELECT * FROM reservations WHERE payment_intent_id = ?');
      return query.all(where.paymentIntentId);
    }
    return [];
  },

  async updateReservation(id: string, data: { status: string }) {
    const query = db.prepare('UPDATE reservations SET status = ? WHERE id = ?');
    query.run(data.status, id);
  },

  // Transaction helper
  transaction<T>(fn: () => T | Promise<T>): T | Promise<T> {
    const txn = db.transaction(fn);
    return txn();
  },

  // Raw query helper
  async queryRaw(sql: string) {
    const query = db.prepare(sql);
    return query.all();
  }
};

// Export for compatibility
export { db, generateId, dateToTimestamp, timestampToDate };
