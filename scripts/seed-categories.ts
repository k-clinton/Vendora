import { db, generateId, dateToTimestamp } from "../lib/sqlite";

const categories = [
  { id: "electronics", name: "Electronics", slug: "electronics" },
  { id: "clothing", name: "Clothing", slug: "clothing" },
  { id: "books", name: "Books", slug: "books" },
  { id: "home", name: "Home & Garden", slug: "home-garden" },
];

function seedCategories() {
  const now = dateToTimestamp(new Date());

  console.log("🌱 Seeding categories...");

  const insert = db.prepare(`
    INSERT OR IGNORE INTO categories (id, slug, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  categories.forEach((cat) => {
    insert.run(cat.id, cat.slug, cat.name, now, now);
    console.log(`Created category: ${cat.name}`);
  });

  console.log("✅ Categories seeded successfully.");
}

seedCategories();
