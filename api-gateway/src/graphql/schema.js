const typeDefs = `
  type User {
    id: String!
    name: String!
    email: String!
    phone: String
  }

  type UserSummary {
    id: String!
    name: String!
    email: String!
  }

  type AuthResponse {
    valid: Boolean!
    id: String
    name: String
    message: String!
  }

  type Restaurant {
    id: String!
    name: String!
    address: String!
    cuisine: String
    phone: String
  }

  type RestaurantSummary {
    id: String!
    name: String!
    address: String!
    cuisine: String
  }

  type Table {
    id: String!
    label: String!
    capacity: Int!
    is_available: Boolean!
  }

  type Reservation {
    id: String!
    user_id: String!
    restaurant_id: String!
    table_id: String!
    date: String!
    party_size: Int!
    status: String!
    notes: String
  }

  type ReservationSummary {
    id: String!
    user_id: String!
    table_id: String!
    date: String!
    status: String!
    party_size: Int!
  }

  type Query {
    getUser(id: String!): User
    listUsers: [UserSummary]
    getRestaurant(id: String!): Restaurant
    listRestaurants(cuisine: String): [RestaurantSummary]
    getAvailableTables(restaurant_id: String!, date: String!, party_size: Int!): [Table]
    getReservation(id: String!): Reservation
    listReservations(restaurant_id: String, date: String): [ReservationSummary]
    getUserReservations(user_id: String!): [ReservationSummary]
  }

  type Mutation {
    registerUser(name: String!, email: String!, password: String!, phone: String): User
    deleteUser(id: String!): MutationResponse
    createRestaurant(name: String!, address: String!, cuisine: String, phone: String): Restaurant
    updateRestaurant(id: String!, name: String, address: String, cuisine: String, phone: String): MutationResponse
    deleteRestaurant(id: String!): MutationResponse
    addTable(restaurant_id: String!, capacity: Int!, label: String!): Table
    createReservation(
      user_id: String!
      restaurant_id: String!
      table_id: String!
      date: String!
      party_size: Int!
      notes: String
    ): ReservationResponse
    cancelReservation(id: String!, user_id: String!): MutationResponse
  }

  type MutationResponse {
    success: Boolean
    message: String
  }

  type ReservationResponse {
    id: String
    status: String
    message: String
  }
`;

module.exports = { typeDefs };
