const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { initDb } = require("./db/database");
const handlers = require("./handlers/userHandlers");

const PROTO_PATH = path.join(__dirname, "../../proto/user.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const start = async () => {
  // Initialize database first
  await initDb();

  const server = new grpc.Server();

  server.addService(userProto.UserService.service, {
    RegisterUser: handlers.registerUser,
    GetUser: handlers.getUser,
    ValidateUser: handlers.validateUser,
    ListUsers: handlers.listUsers,
    DeleteUser: handlers.deleteUser,
  });

  const PORT = "0.0.0.0:50051";

  server.bindAsync(
    PORT,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("[UserService] Failed to start server:", err.message);
        process.exit(1);
      }
      console.log(`[UserService] gRPC server running on port ${port}`);
    },
  );
};

start();
