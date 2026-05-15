const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { initDb } = require("./db/database");
const { connectProducer } = require("./kafka/producer");
const handlers = require("./handlers/reservationHandlers");

const PROTO_PATH = path.join(__dirname, "../../proto/reservation.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const reservationProto =
  grpc.loadPackageDefinition(packageDefinition).reservation;

const start = async () => {
  // Initialize RxDB
  await initDb();

  // Connect Kafka producer
  await connectProducer();

  // Create gRPC server
  const server = new grpc.Server();

  server.addService(reservationProto.ReservationService.service, {
    CreateReservation: handlers.createReservation,
    GetReservation: handlers.getReservation,
    ListReservations: handlers.listReservations,
    CancelReservation: handlers.cancelReservation,
    GetUserReservations: handlers.getUserReservations,
  });

  const PORT = "0.0.0.0:50053";

  server.bindAsync(
    PORT,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error(
          "[ReservationService] Failed to start server:",
          err.message,
        );
        process.exit(1);
      }
      console.log(`[ReservationService] gRPC server running on port ${port}`);
    },
  );
};

start();
