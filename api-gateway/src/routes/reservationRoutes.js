const express = require("express");
const router = express.Router();
const { reservationClient, grpcCall } = require("../grpc/clients");

// POST /api/reservations
router.post("/", async (req, res) => {
  try {
    const result = await grpcCall(reservationClient, "CreateReservation", {
      ...req.body,
      party_size: parseInt(req.body.party_size),
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reservations
router.get("/", async (req, res) => {
  try {
    const result = await grpcCall(reservationClient, "ListReservations", {
      restaurant_id: req.query.restaurant_id || "",
      date: req.query.date || "",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reservations/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await grpcCall(reservationClient, "GetReservation", {
      id: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/reservations/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await grpcCall(reservationClient, "CancelReservation", {
      id: req.params.id,
      user_id: req.body.user_id,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reservations/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const result = await grpcCall(reservationClient, "GetUserReservations", {
      user_id: req.params.userId,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
