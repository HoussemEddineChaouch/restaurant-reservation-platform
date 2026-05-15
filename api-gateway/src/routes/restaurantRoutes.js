const express = require("express");
const router = express.Router();
const { restaurantClient, grpcCall } = require("../grpc/clients");

// POST /api/restaurants
router.post("/", async (req, res) => {
  try {
    const result = await grpcCall(
      restaurantClient,
      "CreateRestaurant",
      req.body,
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/restaurants
router.get("/", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "ListRestaurants", {
      cuisine: req.query.cuisine || "",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "GetRestaurant", {
      id: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/restaurants/:id
router.put("/:id", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "UpdateRestaurant", {
      id: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/restaurants/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "DeleteRestaurant", {
      id: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/restaurants/:id/tables
router.post("/:id/tables", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "AddTable", {
      restaurant_id: req.params.id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/tables/available
router.get("/:id/tables/available", async (req, res) => {
  try {
    const result = await grpcCall(restaurantClient, "GetAvailableTables", {
      restaurant_id: req.params.id,
      date: req.query.date || "",
      party_size: parseInt(req.query.party_size) || 1,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
