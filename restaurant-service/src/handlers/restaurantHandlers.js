const { v4: uuidv4 } = require("uuid");
const { getDb, saveDb } = require("../db/database");

// Restaurant Handlers

const createRestaurant = (call, callback) => {
  try {
    const { name, address, cuisine, phone } = call.request;
    const db = getDb();

    if (!name || !address) {
      return callback({ code: 3, message: "Name and address are required" });
    }

    const id = uuidv4();
    db.run(
      `INSERT INTO restaurants (id, name, address, cuisine, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, name, address, cuisine || "", phone || ""],
    );

    saveDb();
    console.log(`[RestaurantService] Restaurant created: ${name}`);
    callback(null, { id, name, message: "Restaurant created successfully" });
  } catch (err) {
    console.error("[RestaurantService] createRestaurant error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const getRestaurant = (call, callback) => {
  try {
    const { id } = call.request;
    const db = getDb();

    const result = db.exec(
      `SELECT id, name, address, cuisine, phone FROM restaurants WHERE id = '${id}'`,
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return callback({ code: 5, message: "Restaurant not found" });
    }

    const [rid, name, address, cuisine, phone] = result[0].values[0];
    callback(null, {
      id: rid,
      name,
      address,
      cuisine: cuisine || "",
      phone: phone || "",
    });
  } catch (err) {
    console.error("[RestaurantService] getRestaurant error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const listRestaurants = (call, callback) => {
  try {
    const { cuisine } = call.request;
    const db = getDb();

    let query = `SELECT id, name, address, cuisine FROM restaurants`;
    if (cuisine && cuisine.trim() !== "") {
      query += ` WHERE cuisine = '${cuisine}'`;
    }

    const result = db.exec(query);
    const restaurants =
      result.length > 0
        ? result[0].values.map(([id, name, address, cuisine]) => ({
            id,
            name,
            address,
            cuisine: cuisine || "",
          }))
        : [];

    callback(null, { restaurants });
  } catch (err) {
    console.error("[RestaurantService] listRestaurants error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const updateRestaurant = (call, callback) => {
  try {
    const { id, name, address, cuisine, phone } = call.request;
    const db = getDb();

    const result = db.exec(`SELECT id FROM restaurants WHERE id = '${id}'`);
    if (result.length === 0 || result[0].values.length === 0) {
      return callback({ code: 5, message: "Restaurant not found" });
    }

    db.run(
      `UPDATE restaurants SET name = ?, address = ?, cuisine = ?, phone = ? WHERE id = ?`,
      [name, address, cuisine || "", phone || "", id],
    );

    saveDb();
    console.log(`[RestaurantService] Restaurant updated: ${id}`);
    callback(null, {
      success: true,
      message: "Restaurant updated successfully",
    });
  } catch (err) {
    console.error("[RestaurantService] updateRestaurant error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const deleteRestaurant = (call, callback) => {
  try {
    const { id } = call.request;
    const db = getDb();

    const result = db.exec(`SELECT id FROM restaurants WHERE id = '${id}'`);
    if (result.length === 0 || result[0].values.length === 0) {
      return callback({ code: 5, message: "Restaurant not found" });
    }

    db.run(`DELETE FROM restaurants WHERE id = '${id}'`);
    saveDb();

    console.log(`[RestaurantService] Restaurant deleted: ${id}`);
    callback(null, {
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (err) {
    console.error("[RestaurantService] deleteRestaurant error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Table Handlers

const addTable = (call, callback) => {
  try {
    const { restaurant_id, capacity, label } = call.request;
    const db = getDb();

    const restaurant = db.exec(
      `SELECT id FROM restaurants WHERE id = '${restaurant_id}'`,
    );
    if (restaurant.length === 0 || restaurant[0].values.length === 0) {
      return callback({ code: 5, message: "Restaurant not found" });
    }

    const id = uuidv4();
    db.run(
      `INSERT INTO tables (id, restaurant_id, capacity, label, is_available) VALUES (?, ?, ?, ?, 1)`,
      [id, restaurant_id, capacity, label],
    );

    saveDb();
    console.log(
      `[RestaurantService] Table added: ${label} to restaurant ${restaurant_id}`,
    );
    callback(null, { id, label, message: "Table added successfully" });
  } catch (err) {
    console.error("[RestaurantService] addTable error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const getAvailableTables = (call, callback) => {
  try {
    const { restaurant_id, date, party_size } = call.request;
    const db = getDb();

    // Get tables that match capacity and are not booked on this date
    const result = db.exec(`
      SELECT t.id, t.label, t.capacity
      FROM tables t
      WHERE t.restaurant_id = '${restaurant_id}'
        AND t.capacity >= ${party_size}
        AND t.id NOT IN (
          SELECT ta.table_id FROM table_availability ta
          WHERE ta.date = '${date}' AND ta.is_available = 0
        )
    `);

    const tables =
      result.length > 0
        ? result[0].values.map(([id, label, capacity]) => ({
            id,
            label,
            capacity,
            is_available: true,
          }))
        : [];

    callback(null, { tables });
  } catch (err) {
    console.error("[RestaurantService] getAvailableTables error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

const updateTableAvailability = (call, callback) => {
  try {
    const { table_id, is_available, date } = call.request;
    const db = getDb();

    const availableInt = is_available ? 1 : 0;
    const id = uuidv4();

    // Insert or update availability for this date
    db.run(`
      INSERT INTO table_availability (id, table_id, date, is_available)
      VALUES ('${id}', '${table_id}', '${date}', ${availableInt})
      ON CONFLICT(table_id, date) DO UPDATE SET is_available = ${availableInt}
    `);

    saveDb();
    console.log(
      `[RestaurantService] Table ${table_id} availability updated to ${is_available} on ${date}`,
    );
    callback(null, { success: true, message: "Table availability updated" });
  } catch (err) {
    console.error(
      "[RestaurantService] updateTableAvailability error:",
      err.message,
    );
    callback({ code: 13, message: "Internal server error" });
  }
};

module.exports = {
  createRestaurant,
  getRestaurant,
  listRestaurants,
  updateRestaurant,
  deleteRestaurant,
  addTable,
  getAvailableTables,
  updateTableAvailability,
};
