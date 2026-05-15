const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createHandler } = require("graphql-http/lib/use/express");
const { buildSchema } = require("graphql");
const { typeDefs } = require("./graphql/schema");
const { resolvers } = require("./graphql/resolvers");

const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// REST endpoints
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API Gateway is running" });
});

// Build GraphQL schema from typeDefs string
const schema = buildSchema(typeDefs);

// Root resolvers (graphql-http uses rootValue)
const rootValue = {
  // Queries
  getUser: (args) => resolvers.Query.getUser(null, args),
  listUsers: (args) => resolvers.Query.listUsers(null, args),
  getRestaurant: (args) => resolvers.Query.getRestaurant(null, args),
  listRestaurants: (args) => resolvers.Query.listRestaurants(null, args),
  getAvailableTables: (args) => resolvers.Query.getAvailableTables(null, args),
  getReservation: (args) => resolvers.Query.getReservation(null, args),
  listReservations: (args) => resolvers.Query.listReservations(null, args),
  getUserReservations: (args) =>
    resolvers.Query.getUserReservations(null, args),

  // Mutations
  registerUser: (args) => resolvers.Mutation.registerUser(null, args),
  deleteUser: (args) => resolvers.Mutation.deleteUser(null, args),
  createRestaurant: (args) => resolvers.Mutation.createRestaurant(null, args),
  updateRestaurant: (args) => resolvers.Mutation.updateRestaurant(null, args),
  deleteRestaurant: (args) => resolvers.Mutation.deleteRestaurant(null, args),
  addTable: (args) => resolvers.Mutation.addTable(null, args),
  createReservation: (args) => resolvers.Mutation.createReservation(null, args),
  cancelReservation: (args) => resolvers.Mutation.cancelReservation(null, args),
};

// Mount GraphQL endpoint
app.use("/graphql", createHandler({ schema, rootValue }));

app.listen(PORT, () => {
  console.log(`[API Gateway] REST running at http://localhost:${PORT}/api`);
  console.log(
    `[API Gateway] GraphQL running at http://localhost:${PORT}/graphql`,
  );
  console.log(`[API Gateway] Health check at http://localhost:${PORT}/health`);
});
