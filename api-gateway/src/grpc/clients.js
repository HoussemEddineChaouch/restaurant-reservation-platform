const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

// Load proto files
const userProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../../proto/user.proto'), options)
).user;

const restaurantProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../../proto/restaurant.proto'), options)
).restaurant;

const reservationProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../../proto/reservation.proto'), options)
).reservation;

// Create gRPC clients
const userClient = new userProto.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const restaurantClient = new restaurantProto.RestaurantService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const reservationClient = new reservationProto.ReservationService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

// Promisify gRPC calls helper
const grpcCall = (client, method, request) => {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

module.exports = { userClient, restaurantClient, reservationClient, grpcCall };