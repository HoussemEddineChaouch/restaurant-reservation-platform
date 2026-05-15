const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { getDb, saveDb } = require("../db/database");

// Register a new user
const registerUser = (call, callback) => {
  try {
    const { name, email, password, phone } = call.request;
    const db = getDb();

    if (!name || !email || !password) {
      return callback({
        code: 3,
        message: "Name, email and password are required",
      });
    }

    // Check if email exists
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return callback({ code: 6, message: "Email already registered" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.run(
      `INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, hashedPassword, phone || ""],
    );

    saveDb();
    console.log(`[UserService] User registered: ${email}`);

    callback(null, {
      id,
      name,
      email,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("[UserService] registerUser error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Get user by ID
const getUser = (call, callback) => {
  try {
    const { id } = call.request;
    const db = getDb();

    const result = db.exec(
      `SELECT id, name, email, phone FROM users WHERE id = '${id}'`,
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return callback({ code: 5, message: "User not found" });
    }

    const [uid, name, email, phone] = result[0].values[0];
    callback(null, { id: uid, name, email, phone: phone || "" });
  } catch (err) {
    console.error("[UserService] getUser error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Validate user credentials (login)
const validateUser = (call, callback) => {
  try {
    const { email, password } = call.request;
    const db = getDb();

    const result = db.exec(
      `SELECT id, name, email, password FROM users WHERE email = '${email}'`,
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return callback(null, {
        valid: false,
        id: "",
        name: "",
        message: "Invalid email or password",
      });
    }

    const [uid, name, userEmail, hashedPassword] = result[0].values[0];
    const match = bcrypt.compareSync(password, hashedPassword);

    if (!match) {
      return callback(null, {
        valid: false,
        id: "",
        name: "",
        message: "Invalid email or password",
      });
    }

    console.log(`[UserService] User validated: ${email}`);
    callback(null, { valid: true, id: uid, name, message: "Login successful" });
  } catch (err) {
    console.error("[UserService] validateUser error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// List all users
const listUsers = (call, callback) => {
  try {
    const db = getDb();
    const result = db.exec(`SELECT id, name, email FROM users`);

    const users =
      result.length > 0
        ? result[0].values.map(([id, name, email]) => ({ id, name, email }))
        : [];

    callback(null, { users });
  } catch (err) {
    console.error("[UserService] listUsers error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Delete user by ID
const deleteUser = (call, callback) => {
  try {
    const { id } = call.request;
    const db = getDb();

    const result = db.exec(`SELECT id FROM users WHERE id = '${id}'`);
    if (result.length === 0 || result[0].values.length === 0) {
      return callback({ code: 5, message: "User not found" });
    }

    db.run(`DELETE FROM users WHERE id = '${id}'`);
    saveDb();

    console.log(`[UserService] User deleted: ${id}`);
    callback(null, { success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("[UserService] deleteUser error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

module.exports = { registerUser, getUser, validateUser, listUsers, deleteUser };
