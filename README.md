# 🍽️ Restaurant Reservation Platform

A smart restaurant table reservation platform built with a **Node.js microservices architecture**.

## 👤 Author

- [HoussemEddineChaouch](https://github.com/HoussemEddineChaouch)

## Architecture

```
Client (Postman / Browser)
        │
        │ REST + GraphQL (HTTP/1.1 + JSON)
        ▼
┌─────────────────┐
│   API Gateway   │  :3000
│  Express.js     │
│  graphql-http   │
└────────┬────────┘
         │ gRPC (HTTP/2 + Protobuf)
    ┌────┼────────────┐
    ▼    ▼            ▼
┌────────┐ ┌──────────────┐ ┌─────────────────┐
│  User  │ │  Restaurant  │ │   Reservation   │
│Service │ │   Service    │ │    Service      │
│ :50051 │ │   :50052     │ │    :50053       │
│SQLite3 │ │  SQLite3     │ │     RxDB        │
└────────┘ └──────┬───────┘ └────────┬────────┘
                  │   Kafka Events   │
                  └────────┬─────────┘
                           ▼
                   ┌───────────────┐
                   │ Kafka Broker  │
                   │  :9092        │
                   │  (Docker)     │
                   └───────────────┘
```

## Communication Protocols

| Protocol    | Used For               | Between                       |
| ----------- | ---------------------- | ----------------------------- |
| **REST**    | CRUD operations        | Client ↔ API Gateway          |
| **GraphQL** | Flexible queries       | Client ↔ API Gateway          |
| **gRPC**    | Internal service calls | API Gateway ↔ Microservices   |
| **Kafka**   | Async event messaging  | Microservices ↔ Microservices |

## Microservices

| Service               | Port  | Database | Role                       |
| --------------------- | ----- | -------- | -------------------------- |
| `api-gateway`         | 3000  | —        | REST + GraphQL entry point |
| `user-service`        | 50051 | SQLite3  | User registration & login  |
| `restaurant-service`  | 50052 | SQLite3  | Restaurants & tables       |
| `reservation-service` | 50053 | RxDB     | Bookings & cancellations   |

## Kafka Topics

| Topic                        | Producer            | Consumer            | Trigger                |
| ---------------------------- | ------------------- | ------------------- | ---------------------- |
| `reservation.created`        | reservation-service | restaurant-service  | User books a table     |
| `reservation.cancelled`      | reservation-service | restaurant-service  | User cancels a booking |
| `table.availability.updated` | restaurant-service  | reservation-service | Table status changes   |

## Tech Stack

- **Runtime:** Node.js v24
- **gRPC:** @grpc/grpc-js + Protocol Buffers
- **REST:** Express.js
- **GraphQL:** graphql-http + graphql
- **Messaging:** Apache Kafka (KafkaJS) via Docker
- **Databases:** sql.js (SQLite3) + RxDB (NoSQL)
- **Infrastructure:** Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js v18+
- Docker Desktop (running)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/HoussemEddineChaouch/restaurant-reservation-platform.git
cd restaurant-reservation-platform
```

### 2. Start Kafka and Zookeeper

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

### 3. Create Kafka topics

```bash
docker exec kafka kafka-topics --create --topic reservation.created --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
docker exec kafka kafka-topics --create --topic reservation.cancelled --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
docker exec kafka kafka-topics --create --topic table.availability.updated --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### 4. Install dependencies for each service

```bash
cd user-service && npm install && cd ..
cd restaurant-service && npm install && cd ..
cd reservation-service && npm install && cd ..
cd api-gateway && npm install && cd ..
```

### 5. Start all services (4 separate terminals)

**Terminal 1 — User Service:**

```bash
cd user-service && node src/index.js
```

**Terminal 2 — Restaurant Service:**

```bash
cd restaurant-service && node src/index.js
```

**Terminal 3 — Reservation Service:**

```bash
cd reservation-service && node src/index.js
```

**Terminal 4 — API Gateway:**

```bash
cd api-gateway && node src/index.js
```

### 6. Verify everything is running

| Service      | URL                           | Expected                                             |
| ------------ | ----------------------------- | ---------------------------------------------------- |
| Health check | http://localhost:3000/health  | `{"status":"ok","message":"API Gateway is running"}` |
| REST API     | http://localhost:3000/api     | —                                                    |
| GraphQL      | http://localhost:3000/graphql | —                                                    |

## API Reference

### REST Endpoints

#### Users

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| POST   | `/api/users/register` | Register new user |
| POST   | `/api/users/login`    | Login             |
| GET    | `/api/users`          | List all users    |
| GET    | `/api/users/:id`      | Get user by ID    |
| DELETE | `/api/users/:id`      | Delete user       |

#### Restaurants

| Method | Endpoint                                | Description          |
| ------ | --------------------------------------- | -------------------- |
| POST   | `/api/restaurants`                      | Create restaurant    |
| GET    | `/api/restaurants`                      | List restaurants     |
| GET    | `/api/restaurants/:id`                  | Get restaurant       |
| PUT    | `/api/restaurants/:id`                  | Update restaurant    |
| DELETE | `/api/restaurants/:id`                  | Delete restaurant    |
| POST   | `/api/restaurants/:id/tables`           | Add table            |
| GET    | `/api/restaurants/:id/tables/available` | Get available tables |

#### Reservations

| Method | Endpoint                         | Description           |
| ------ | -------------------------------- | --------------------- |
| POST   | `/api/reservations`              | Create reservation    |
| GET    | `/api/reservations`              | List reservations     |
| GET    | `/api/reservations/:id`          | Get reservation       |
| GET    | `/api/reservations/user/:userId` | Get user reservations |
| DELETE | `/api/reservations/:id`          | Cancel reservation    |

### GraphQL Queries

```graphql
# Get all restaurants
{
  listRestaurants {
    id
    name
    address
    cuisine
  }
}

# Get user by ID
{
  getUser(id: "USER_ID") {
    id
    name
    email
    phone
  }
}

# Get available tables
{
  getAvailableTables(restaurant_id: "ID", date: "2026-06-01", party_size: 2) {
    id
    label
    capacity
  }
}

# Get user reservations
{
  getUserReservations(user_id: "USER_ID") {
    id
    date
    status
    party_size
  }
}
```

### GraphQL Mutations

```graphql
# Register user
mutation {
  registerUser(name: "John", email: "john@test.com", password: "123456") {
    id
    name
    email
  }
}

# Create reservation
mutation {
  createReservation(
    user_id: "USER_ID"
    restaurant_id: "REST_ID"
    table_id: "TABLE_ID"
    date: "2026-06-01"
    party_size: 2
    notes: "Window seat"
  ) {
    id
    status
    message
  }
}

# Cancel reservation
mutation {
  cancelReservation(id: "RES_ID", user_id: "USER_ID") {
    success
    message
  }
}
```

## Project Structure

```
restaurant-reservation-platform/
├── api-gateway/
│   └── src/
│       ├── grpc/clients.js           # gRPC clients for all services
│       ├── routes/
│       │   ├── userRoutes.js         # REST user endpoints
│       │   ├── restaurantRoutes.js   # REST restaurant endpoints
│       │   └── reservationRoutes.js  # REST reservation endpoints
│       ├── graphql/
│       │   ├── schema.js             # GraphQL type definitions
│       │   └── resolvers.js          # GraphQL resolvers
│       └── index.js                  # Express + GraphQL server :3000
├── user-service/
│   └── src/
│       ├── db/database.js            # SQLite3 setup (sql.js)
│       ├── handlers/userHandlers.js  # gRPC method implementations
│       └── index.js                  # gRPC server :50051
├── restaurant-service/
│   └── src/
│       ├── db/database.js            # SQLite3 setup (sql.js)
│       ├── handlers/restaurantHandlers.js
│       ├── kafka/consumer.js         # Kafka event consumer
│       └── index.js                  # gRPC server :50052
├── reservation-service/
│   └── src/
│       ├── db/database.js            # RxDB setup
│       ├── handlers/reservationHandlers.js
│       ├── kafka/producer.js         # Kafka event producer
│       └── index.js                  # gRPC server :50053
├── proto/
│   ├── user.proto                    # User service gRPC contract
│   ├── restaurant.proto              # Restaurant service gRPC contract
│   └── reservation.proto             # Reservation service gRPC contract
├── docs/
│   ├── kafka.md                      # Kafka topics documentation
│   └── architecture.md              # Architecture documentation
├── docker-compose.yml                # Kafka + Zookeeper setup
└── README.md
```

## Links

- **GitHub Repository:** https://github.com/HoussemEddineChaouch/restaurant-reservation-platform
- **Postman Collection:** https://dssq00.postman.co/workspace/Restaurant-Reservation-Platform~4e91d0e9-6c09-438d-bc3f-f6a06b7b1781/collection/32738057-fe2f8340-1fa8-4627-85cf-0b48e87c05df?action=share&creator=32738057

## Course

SOA et Microservices — Dr. Salah Gontara — A.U. 2025-26
