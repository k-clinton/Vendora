const Database = require('better-sqlite3');
const db = new Database('./data/ecommerce.db');

const rows = db.prepare('SELECT id, price FROM product_variants LIMIT 5').all();
console.log(JSON.stringify(rows, null, 2));
