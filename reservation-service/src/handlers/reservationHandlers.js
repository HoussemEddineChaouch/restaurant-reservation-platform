const { v4: uuidv4 } = require("uuid");
const { getCollection, saveDb } = require("../db/database");
const { publishEvent } = require("../kafka/producer");

// Create a new reservation
const createReservation = async (call, callback) => {
  try {
    const { user_id, restaurant_id, table_id, date, party_size, notes } =
      call.request;
    const collection = getCollection();

    if (!user_id || !restaurant_id || !table_id || !date || !party_size) {
      return callback({ code: 3, message: "All fields are required" });
    }

    const id = uuidv4();
    const reservation = {
      id,
      user_id,
      restaurant_id,
      table_id,
      date,
      party_size,
      status: "confirmed",
      notes: notes || "",
    };

    await collection.insert(reservation);
    await saveDb();

    // Publish Kafka event
    await publishEvent("reservation.created", {
      reservationId: id,
      restaurantId: restaurant_id,
      tableId: table_id,
      userId: user_id,
      date,
      partySize: party_size,
    });

    console.log(`[ReservationService] Reservation created: ${id}`);
    callback(null, {
      id,
      status: "confirmed",
      message: "Reservation created successfully",
    });
  } catch (err) {
    console.error("[ReservationService] createReservation error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Get reservation by ID
const getReservation = async (call, callback) => {
  try {
    const { id } = call.request;
    const collection = getCollection();

    const doc = await collection.findOne(id).exec();

    if (!doc) {
      return callback({ code: 5, message: "Reservation not found" });
    }

    const r = doc.toJSON();
    callback(null, {
      id: r.id,
      user_id: r.user_id,
      restaurant_id: r.restaurant_id,
      table_id: r.table_id,
      date: r.date,
      party_size: r.party_size,
      status: r.status,
      notes: r.notes || "",
    });
  } catch (err) {
    console.error("[ReservationService] getReservation error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// List reservations with optional filters
const listReservations = async (call, callback) => {
  try {
    const { restaurant_id, date } = call.request;
    const collection = getCollection();

    const query = {};
    if (restaurant_id) query.restaurant_id = restaurant_id;
    if (date) query.date = date;

    const selector = Object.keys(query).length > 0 ? query : {};
    const docs = await collection.find({ selector }).exec();

    const reservations = docs.map((doc) => {
      const r = doc.toJSON();
      return {
        id: r.id,
        user_id: r.user_id,
        table_id: r.table_id,
        date: r.date,
        status: r.status,
        party_size: r.party_size,
      };
    });

    callback(null, { reservations });
  } catch (err) {
    console.error("[ReservationService] listReservations error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Cancel a reservation
const cancelReservation = async (call, callback) => {
  try {
    const { id, user_id } = call.request;
    const collection = getCollection();

    const doc = await collection.findOne(id).exec();

    if (!doc) {
      return callback({ code: 5, message: "Reservation not found" });
    }

    const r = doc.toJSON();

    if (r.user_id !== user_id) {
      return callback({
        code: 7,
        message: "Not authorized to cancel this reservation",
      });
    }

    if (r.status === "cancelled") {
      return callback({ code: 3, message: "Reservation already cancelled" });
    }

    await doc.patch({ status: "cancelled" });
    await saveDb();

    // Publish Kafka event
    await publishEvent("reservation.cancelled", {
      reservationId: id,
      tableId: r.table_id,
      date: r.date,
    });

    console.log(`[ReservationService] Reservation cancelled: ${id}`);
    callback(null, {
      success: true,
      message: "Reservation cancelled successfully",
    });
  } catch (err) {
    console.error("[ReservationService] cancelReservation error:", err.message);
    callback({ code: 13, message: "Internal server error" });
  }
};

// Get all reservations for a user
const getUserReservations = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const collection = getCollection();

    const docs = await collection
      .find({
        selector: { user_id },
      })
      .exec();

    const reservations = docs.map((doc) => {
      const r = doc.toJSON();
      return {
        id: r.id,
        user_id: r.user_id,
        table_id: r.table_id,
        date: r.date,
        status: r.status,
        party_size: r.party_size,
      };
    });

    callback(null, { reservations });
  } catch (err) {
    console.error(
      "[ReservationService] getUserReservations error:",
      err.message,
    );
    callback({ code: 13, message: "Internal server error" });
  }
};

module.exports = {
  createReservation,
  getReservation,
  listReservations,
  cancelReservation,
  getUserReservations,
};
