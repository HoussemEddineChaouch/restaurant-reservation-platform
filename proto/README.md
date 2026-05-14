# gRPC Proto Files

This folder contains the Protobuf contracts for all microservices.

## Files

| File                | Service            | Port  |
| ------------------- | ------------------ | ----- |
| `user.proto`        | UserService        | 50051 |
| `restaurant.proto`  | RestaurantService  | 50052 |
| `reservation.proto` | ReservationService | 50053 |

## Methods Summary

### UserService

| Method         | Description                       |
| -------------- | --------------------------------- |
| `RegisterUser` | Create a new user account         |
| `GetUser`      | Fetch user by ID                  |
| `ValidateUser` | Login — validate email + password |
| `ListUsers`    | List all users                    |
| `DeleteUser`   | Delete a user by ID               |

### RestaurantService

| Method                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `CreateRestaurant`        | Add a new restaurant                           |
| `GetRestaurant`           | Get restaurant details                         |
| `ListRestaurants`         | List all restaurants (filterable by cuisine)   |
| `UpdateRestaurant`        | Update restaurant info                         |
| `DeleteRestaurant`        | Delete a restaurant                            |
| `AddTable`                | Add a table to a restaurant                    |
| `GetAvailableTables`      | Get available tables for a date and party size |
| `UpdateTableAvailability` | Mark a table as available or not               |

### ReservationService

| Method                | Description                     |
| --------------------- | ------------------------------- |
| `CreateReservation`   | Book a table                    |
| `GetReservation`      | Get reservation details         |
| `ListReservations`    | List reservations (filterable)  |
| `CancelReservation`   | Cancel a booking                |
| `GetUserReservations` | Get all reservations for a user |
