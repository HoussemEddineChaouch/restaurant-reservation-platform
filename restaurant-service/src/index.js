const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { initDb } = require("./db/database");
const handlers = require("./handlers/restaurantHandlers");
const { startConsumer } = require("./kafka/consumer");

const PROTO_PATH = path.join(__dirname, "../../proto/restaurant.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const restaurantProto =
  grpc.loadPackageDefinition(packageDefinition).restaurant;

const start = async () => {
  // Initialize database
  await initDb();

  // Start Kafka consumer
  await startConsumer();

  // Create gRPC server
  const server = new grpc.Server();

  server.addService(restaurantProto.RestaurantService.service, {
    CreateRestaurant: handlers.createRestaurant,
    GetRestaurant: handlers.getRestaurant,
    ListRestaurants: handlers.listRestaurants,
    UpdateRestaurant: handlers.updateRestaurant,
    DeleteRestaurant: handlers.deleteRestaurant,
    AddTable: handlers.addTable,
    GetAvailableTables: handlers.getAvailableTables,
    UpdateTableAvailability: handlers.updateTableAvailability,
  });

  const PORT = "0.0.0.0:50052";

  server.bindAsync(
    PORT,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error(
          "[RestaurantService] Failed to start server:",
          err.message,
        );
        process.exit(1);
      }
      console.log(`[RestaurantService] gRPC server running on port ${port}`);
    },
  );
};

start();
