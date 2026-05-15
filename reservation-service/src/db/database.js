const { createRxDatabase, addRxPlugin } = require("rxdb");
const { getRxStorageMemory } = require("rxdb/plugins/storage-memory");
const { RxDBJsonDumpPlugin } = require("rxdb/plugins/json-dump");
const fs = require("fs");
const path = require("path");

addRxPlugin(RxDBJsonDumpPlugin);

const DB_PATH = path.join(__dirname, "../../reservations.json");

let db;
let reservationsCollection;

const reservationSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    user_id: { type: "string" },
    restaurant_id: { type: "string" },
    table_id: { type: "string" },
    date: { type: "string" },
    party_size: { type: "number" },
    status: { type: "string" },
    notes: { type: "string" },
  },
  required: [
    "id",
    "user_id",
    "restaurant_id",
    "table_id",
    "date",
    "party_size",
    "status",
  ],
};

const initDb = async () => {
  db = await createRxDatabase({
    name: "reservationsdb",
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });

  await db.addCollections({
    reservations: { schema: reservationSchema },
  });

  reservationsCollection = db.reservations;

  // Load persisted data from JSON file if exists
  if (fs.existsSync(DB_PATH)) {
    try {
      const json = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      await db.importJSON(json);
      console.log("[ReservationService] RxDB data loaded from disk");
    } catch (err) {
      console.log("[ReservationService] No existing data to load");
    }
  }

  console.log("[ReservationService] RxDB database initialized");
};

// Save database to disk as JSON
const saveDb = async () => {
  try {
    const json = await db.exportJSON();
    fs.writeFileSync(DB_PATH, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("[ReservationService] saveDb error:", err.message);
  }
};

const getCollection = () => reservationsCollection;

module.exports = { initDb, saveDb, getCollection };
