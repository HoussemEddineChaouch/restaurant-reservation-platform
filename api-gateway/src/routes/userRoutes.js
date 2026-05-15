const express = require("express");
const router = express.Router();
const { userClient, grpcCall } = require("../grpc/clients");

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const result = await grpcCall(userClient, "RegisterUser", req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const result = await grpcCall(userClient, "ValidateUser", req.body);
    if (!result.valid) return res.status(401).json({ error: result.message });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const result = await grpcCall(userClient, "ListUsers", {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await grpcCall(userClient, "GetUser", { id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await grpcCall(userClient, "DeleteUser", {
      id: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
