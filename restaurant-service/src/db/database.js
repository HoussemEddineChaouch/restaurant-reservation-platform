const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../restaurant.db");

let db;

const getDb = () => db;

const initDb = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create restaurants table
  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      cuisine TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create tables table
  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      label TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
  `);

  // Create table availability per date
  db.run(`
    CREATE TABLE IF NOT EXISTS table_availability (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      date TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      UNIQUE(table_id, date)
    )
  `);

  saveDb();
  console.log("[RestaurantService] SQLite3 database initialized");
};

const saveDb = () => {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};

module.exports = { getDb, initDb, saveDb };
