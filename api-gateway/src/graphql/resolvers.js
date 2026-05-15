const {
  userClient,
  restaurantClient,
  reservationClient,
  grpcCall,
} = require("../grpc/clients");

const resolvers = {
  Query: {
    // Users
    getUser: async (_, { id }) => {
      return await grpcCall(userClient, "GetUser", { id });
    },
    listUsers: async () => {
      const result = await grpcCall(userClient, "ListUsers", {});
      return result.users;
    },

    // Restaurants
    getRestaurant: async (_, { id }) => {
      return await grpcCall(restaurantClient, "GetRestaurant", { id });
    },
    listRestaurants: async (_, { cuisine }) => {
      const result = await grpcCall(restaurantClient, "ListRestaurants", {
        cuisine: cuisine || "",
      });
      return result.restaurants;
    },
    getAvailableTables: async (_, { restaurant_id, date, party_size }) => {
      const result = await grpcCall(restaurantClient, "GetAvailableTables", {
        restaurant_id,
        date,
        party_size,
      });
      return result.tables;
    },

    // Reservations
    getReservation: async (_, { id }) => {
      return await grpcCall(reservationClient, "GetReservation", { id });
    },
    listReservations: async (_, { restaurant_id, date }) => {
      const result = await grpcCall(reservationClient, "ListReservations", {
        restaurant_id: restaurant_id || "",
        date: date || "",
      });
      return result.reservations;
    },
    getUserReservations: async (_, { user_id }) => {
      const result = await grpcCall(reservationClient, "GetUserReservations", {
        user_id,
      });
      return result.reservations;
    },
  },

  Mutation: {
    // Users
    registerUser: async (_, args) => {
      return await grpcCall(userClient, "RegisterUser", args);
    },
    deleteUser: async (_, { id }) => {
      return await grpcCall(userClient, "DeleteUser", { id });
    },

    // Restaurants
    createRestaurant: async (_, args) => {
      return await grpcCall(restaurantClient, "CreateRestaurant", args);
    },
    updateRestaurant: async (_, args) => {
      return await grpcCall(restaurantClient, "UpdateRestaurant", args);
    },
    deleteRestaurant: async (_, { id }) => {
      return await grpcCall(restaurantClient, "DeleteRestaurant", { id });
    },
    addTable: async (_, args) => {
      const result = await grpcCall(restaurantClient, "AddTable", args);
      return {
        id: result.id,
        label: result.label,
        capacity: args.capacity,
        is_available: true,
      };
    },

    // Reservations
    createReservation: async (_, args) => {
      return await grpcCall(reservationClient, "CreateReservation", args);
    },
    cancelReservation: async (_, { id, user_id }) => {
      return await grpcCall(reservationClient, "CancelReservation", {
        id,
        user_id,
      });
    },
  },
};

module.exports = { resolvers };
