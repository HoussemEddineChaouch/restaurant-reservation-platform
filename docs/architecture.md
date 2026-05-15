# Architecture Documentation

## Overview

The Restaurant Reservation Platform is built on a microservices architecture
using Node.js. Each service is independent, has its own database, and
communicates through well-defined interfaces.

## Communication Flow

### Client to API Gateway

- Protocol: HTTP/1.1
- Format: JSON
- Interfaces: REST and GraphQL

### API Gateway to Microservices

- Protocol: HTTP/2
- Format: Protocol Buffers (Protobuf)
- Interface: gRPC

### Microservice to Microservice

- Protocol: Kafka
- Format: JSON messages
- Pattern: Event-driven (publish/subscribe)

## gRPC Services

### UserService (port 50051)

Handles all user-related operations.

| Method       | Request                      | Response                 |
| ------------ | ---------------------------- | ------------------------ |
| RegisterUser | name, email, password, phone | id, name, email, message |
| GetUser      | id                           | id, name, email, phone   |
| ValidateUser | email, password              | valid, id, name, message |
| ListUsers    | —                            | users[]                  |
| DeleteUser   | id                           | success, message         |

### RestaurantService (port 50052)

Handles restaurant and table management.

| Method                  | Request                           | Response                          |
| ----------------------- | --------------------------------- | --------------------------------- |
| CreateRestaurant        | name, address, cuisine, phone     | id, name, message                 |
| GetRestaurant           | id                                | id, name, address, cuisine, phone |
| ListRestaurants         | cuisine?                          | restaurants[]                     |
| UpdateRestaurant        | id, name, address, cuisine, phone | success, message                  |
| DeleteRestaurant        | id                                | success, message                  |
| AddTable                | restaurant_id, capacity, label    | id, label, message                |
| GetAvailableTables      | restaurant_id, date, party_size   | tables[]                          |
| UpdateTableAvailability | table_id, is_available, date      | success, message                  |

### ReservationService (port 50053)

Handles booking lifecycle.

| Method              | Request                                                   | Response                |
| ------------------- | --------------------------------------------------------- | ----------------------- |
| CreateReservation   | user_id, restaurant_id, table_id, date, party_size, notes | id, status, message     |
| GetReservation      | id                                                        | full reservation object |
| ListReservations    | restaurant_id?, date?                                     | reservations[]          |
| CancelReservation   | id, user_id                                               | success, message        |
| GetUserReservations | user_id                                                   | reservations[]          |

## Database Design

### user-service — SQLite3 (sql.js)

```sql
users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  created_at TEXT
)
```

### restaurant-service — SQLite3 (sql.js)

```sql
restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  cuisine TEXT,
  phone TEXT,
  created_at TEXT
)

tables (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT,
  capacity INTEGER,
  label TEXT,
  is_available INTEGER
)

table_availability (
  id TEXT PRIMARY KEY,
  table_id TEXT,
  date TEXT,
  is_available INTEGER,
  UNIQUE(table_id, date)
)
```

### reservation-service — RxDB (NoSQL)

```json
{
  "id": "string",
  "user_id": "string",
  "restaurant_id": "string",
  "table_id": "string",
  "date": "string",
  "party_size": "number",
  "status": "string",
  "notes": "string"
}
```

## Kafka Event Flow

```
User creates reservation
  → reservation-service.CreateReservation()
  → INSERT into RxDB
  → PUBLISH reservation.created to Kafka
  → restaurant-service consumes reservation.created
  → MARK table as unavailable on that date

User cancels reservation
  → reservation-service.CancelReservation()
  → UPDATE status = cancelled in RxDB
  → PUBLISH reservation.cancelled to Kafka
  → restaurant-service consumes reservation.cancelled
  → MARK table as available again on that date
```
