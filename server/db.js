const { Pool } = require("pg");

// DEBUG
console.log("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);

// Utiliser DATABASE_URL de Railway en production, localhost en développement
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://ashoka_user:motdepasse123@localhost:5432/ashoka_livetv",
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
