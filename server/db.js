// server/db.js
const { Pool } = require("pg");

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  user: "ashoka_user",
  host: "localhost",
  database: "ashoka_livetv",
  password: "motdepasse123",
  port: 5432,
});

// Tester la connexion
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
