import { db } from "../lib/sqlite";
import path from "path";

console.log("--- Database Diagnostic ---");
console.log("DB Object:", db);
console.log("DB Name:", db.name);
// precise path might be hidden in db object internal structure or we just check the file
console.log(
  "Expected DB Path:",
  path.join(process.cwd(), "data", "ecommerce.db"),
);

try {
  const categories = db.prepare("SELECT * FROM categories").all();
  console.log(`\nFound ${categories.length} categories:`);
  categories.forEach((c: any) => console.log(` - [${c.id}] ${c.name}`));

  const products = db.prepare("SELECT * FROM products").all();
  console.log(`\nFound ${products.length} products.`);
} catch (error) {
  console.error("Error querying database:", error);
}
