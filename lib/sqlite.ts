import Database from "better-sqlite3";
import { join } from "path";

const dbPath =
  process.env.DATABASE_PATH || join(process.cwd(), "data", "ecommerce.db");

// Initialize SQLite database
// @ts-ignore - better-sqlite3 types may not be fully compatible
export const db: any = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Initialize schema
export function initializeDatabase() {
  // Create tables based on the Prisma schema

  // Users table (for NextAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      email_verified INTEGER,
      image TEXT,
      role TEXT DEFAULT 'CUSTOMER',
      password TEXT,
      disabled INTEGER DEFAULT 0,
      disabled_reason TEXT,
      disabled_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Migrations: Add missing columns if they don't exist (for existing databases)
  try {
    // Users table migrations
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all();
    const userColumns = userTableInfo.map((col: any) => col.name);
    
    if (!userColumns.includes("password")) {
      console.log("Migrating: Adding password column to users table...");
      db.exec("ALTER TABLE users ADD COLUMN password TEXT");
    }
    if (!userColumns.includes("disabled")) {
      console.log("Migrating: Adding disabled column to users table...");
      db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0");
    }
    if (!userColumns.includes("disabled_reason")) {
      console.log("Migrating: Adding disabled_reason column to users table...");
      db.exec("ALTER TABLE users ADD COLUMN disabled_reason TEXT");
    }
    if (!userColumns.includes("disabled_at")) {
      console.log("Migrating: Adding disabled_at column to users table...");
      db.exec("ALTER TABLE users ADD COLUMN disabled_at INTEGER");
    }

    // Orders table migrations
    const orderTableInfo = db.prepare("PRAGMA table_info(orders)").all();
    const orderColumns = orderTableInfo.map((col: any) => col.name);
    
    if (!orderColumns.includes("payment_status")) {
      console.log("Migrating: Adding payment_status column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
    }
    if (!orderColumns.includes("tracking_number")) {
      console.log("Migrating: Adding tracking_number column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN tracking_number TEXT");
    }
    if (!orderColumns.includes("refund_id")) {
      console.log("Migrating: Adding refund_id column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN refund_id TEXT");
    }
    if (!orderColumns.includes("refund_amount")) {
      console.log("Migrating: Adding refund_amount column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN refund_amount INTEGER");
    }
    if (!orderColumns.includes("refund_reason")) {
      console.log("Migrating: Adding refund_reason column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN refund_reason TEXT");
    }
    if (!orderColumns.includes("refunded_at")) {
      console.log("Migrating: Adding refunded_at column to orders table...");
      db.exec("ALTER TABLE orders ADD COLUMN refunded_at INTEGER");
    }
  } catch (error) {
    console.error("Migration error:", error);
  }

  // Accounts table (for NextAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_account_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
  `);

  // Sessions table (for NextAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  // Verification tokens table (for NextAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires INTEGER NOT NULL,
      UNIQUE(identifier, token)
    );
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      category_id TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  `);

  // Product variants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      currency TEXT NOT NULL,
      image TEXT,
      attributes TEXT,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
    CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(active);
  `);

  // Inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      variant_id TEXT UNIQUE NOT NULL,
      in_stock INTEGER DEFAULT 0,
      reserved INTEGER DEFAULT 0,
      low_stock_level INTEGER,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory(variant_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at);
  `);

  // Reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      variant_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      payment_intent_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_reservations_variant_id ON reservations(variant_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_payment_intent_id ON reservations(payment_intent_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      total INTEGER NOT NULL,
      currency TEXT NOT NULL,
      payment_intent_id TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      currency TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
  `);

  // Discounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      value INTEGER NOT NULL,
      active INTEGER DEFAULT 1,
      starts_at INTEGER,
      ends_at INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
    CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
  `);

  // Order discounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_discounts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      discount_id TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (discount_id) REFERENCES discounts(id),
      UNIQUE(order_id, discount_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_order_discounts_order_id ON order_discounts(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_discounts_discount_id ON order_discounts(discount_id);
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(product_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
  `);

  // Migration: Add updated_at column to reviews table if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(reviews)").all();
    const hasUpdatedAt = tableInfo.some(
      (col: any) => col.name === "updated_at",
    );
    if (!hasUpdatedAt) {
      console.log("Migrating: Adding updated_at column to reviews table...");
      db.exec(
        "ALTER TABLE reviews ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0",
      );
    }
  } catch (error) {
    console.error("Migration error (reviews):", error);
  }

  // Shipping address table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_addresses (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT,
      postal TEXT NOT NULL,
      country TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_shipping_addresses_order_id ON shipping_addresses(order_id);
  `);

  // Store settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY,
      store_name TEXT DEFAULT 'My Store',
      store_logo TEXT,
      currency TEXT DEFAULT 'usd',
      tax_rate REAL DEFAULT 0.0,
      low_stock_threshold INTEGER DEFAULT 10,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Initialize default settings if not exists
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM store_settings').get() as any;
  if (settingsCount.count === 0) {
    const now = dateToTimestamp(new Date());
    db.prepare(`
      INSERT INTO store_settings (id, store_name, currency, tax_rate, low_stock_threshold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), 'My Store', 'usd', 0.0, 10, now, now);
  }

  // Activity log table for admin tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
  `);

  // Email verification tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
  `);

  // Password reset tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
  `);

  console.log("✓ SQLite database schema initialized");
}

// Helper function to generate CUID-like IDs
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
}

// Helper to convert Date to Unix timestamp
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

// Helper to convert Unix timestamp to Date
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

// Initialize database on module load
initializeDatabase();

export default db;
