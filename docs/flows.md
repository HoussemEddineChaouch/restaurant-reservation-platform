# 🔄 Request Flow Documentation

This document traces the complete journey of requests through the system,
file by file, for both REST/gRPC and GraphQL flows.

---

## Flow 1 — REST + gRPC (Register User)

### Request

```
POST http://localhost:3000/api/users/register
{
  "name": "Houssem",
  "email": "houssem@test.com",
  "password": "123456",
  "phone": "0612345678"
}
```

### Complete Round Trip

```
POSTMAN
  │ POST /api/users/register { name, email, password, phone }
  │
  ▼
[1] api-gateway/src/index.js
  │ Express receives the HTTP request
  │ bodyParser.json() parses the JSON body
  │ URL starts with /api/users → routes to userRoutes
  │
  ▼
[2] api-gateway/src/routes/userRoutes.js
  │ router.post('/register') matches
  │ req.body = { name, email, password, phone }
  │ calls grpcCall(userClient, 'RegisterUser', req.body)
  │
  ▼
[3] api-gateway/src/grpc/clients.js
  │ grpcCall wraps gRPC callback in a Promise
  │ userClient.RegisterUser(request, callback)
  │ data serialized from JSON → Protobuf binary
  │ sent over HTTP/2 to localhost:50051
  │
  ▼
[4] proto/user.proto
  │ defines the binary structure of the request
  │ RegisterUserRequest { name=1, email=2, password=3, phone=4 }
  │ data decoded on arrival using this contract
  │
  ▼
[5] user-service/src/index.js
  │ gRPC server receives the incoming call on port 50051
  │ matches method RegisterUser
  │ routes to handlers.registerUser
  │
  ▼
[6] user-service/src/handlers/userHandlers.js
  │ extracts data from call.request
  │ validates required fields
  │ checks for duplicate email in database
  │ hashes password with bcrypt
  │ generates unique ID with uuid
  │ calls db.run(INSERT INTO users...)
  │
  ▼
[7] user-service/src/db/database.js
  │ db.run() writes user to memory (sql.js)
  │ saveDb() persists database to users.db file on disk
  │ returns control to handler
  │
  ▼
[6] user-service/src/handlers/userHandlers.js
  │ callback(null, { id, name, email, message })
  │ response serialized to Protobuf binary
  │ sent back over HTTP/2 to api-gateway
  │
  ▼
[3] api-gateway/src/grpc/clients.js
  │ Promise resolves with response object
  │
  ▼
[2] api-gateway/src/routes/userRoutes.js
  │ result = { id, name, email, message }
  │ res.status(201).json(result)
  │
  ▼
POSTMAN receives:
{
  "id": "a3f8c2d1-...",
  "name": "Houssem",
  "email": "houssem@test.com",
  "message": "User registered successfully"
}
```

### File Roles Summary

| File                                        | Role                                                      |
| ------------------------------------------- | --------------------------------------------------------- |
| `api-gateway/src/index.js`                  | Front door — receives HTTP, routes to correct router      |
| `api-gateway/src/routes/userRoutes.js`      | Matches URL and method, calls gRPC, returns HTTP response |
| `api-gateway/src/grpc/clients.js`           | Creates gRPC clients, serializes and sends requests       |
| `proto/user.proto`                          | The contract — defines data structure for both sides      |
| `user-service/src/index.js`                 | gRPC server — listens on port 50051, routes to handlers   |
| `user-service/src/handlers/userHandlers.js` | Business logic — validates, processes, calls database     |
| `user-service/src/db/database.js`           | Database setup — reads and writes SQLite3                 |

---

## Flow 2 — GraphQL (Get User Reservations)

### Request

```
POST http://localhost:3000/graphql
{
  "query": "{ getUserReservations(user_id: \"USER_ID\") { id date status party_size } }"
}
```

### Complete Round Trip

```
POSTMAN
  │ POST /graphql
  │ { "query": "{ getUserReservations(user_id: \"abc\") { id date status } }" }
  │
  ▼
[1] api-gateway/src/index.js
  │ Express receives the HTTP POST request
  │ URL is /graphql → routes to graphql-http handler
  │ createHandler({ schema, rootValue }) intercepts
  │
  ▼
[2] api-gateway/src/graphql/schema.js
  │ graphql-http parses the query string
  │ validates it against the schema
  │ finds: getUserReservations(user_id: String!): [ReservationSummary]
  │ confirms the requested fields are valid: id, date, status
  │
  ▼
[3] api-gateway/src/index.js (rootValue)
  │ rootValue maps getUserReservations to resolver function
  │ getUserReservations: (args) =>
  │   resolvers.Query.getUserReservations(null, args)
  │
  ▼
[4] api-gateway/src/graphql/resolvers.js
  │ getUserReservations resolver executes
  │ calls grpcCall(reservationClient, 'GetUserReservations', { user_id })
  │
  ▼
[5] api-gateway/src/grpc/clients.js
  │ grpcCall wraps gRPC callback in a Promise
  │ reservationClient.GetUserReservations(request, callback)
  │ data serialized from JSON → Protobuf binary
  │ sent over HTTP/2 to localhost:50053
  │
  ▼
[6] proto/reservation.proto
  │ defines the binary structure
  │ GetUserReservationsRequest { user_id=1 }
  │ GetUserReservationsResponse { repeated ReservationSummary reservations }
  │ data decoded on arrival using this contract
  │
  ▼
[7] reservation-service/src/index.js
  │ gRPC server receives the call on port 50053
  │ matches method GetUserReservations
  │ routes to handlers.getUserReservations
  │
  ▼
[8] reservation-service/src/handlers/reservationHandlers.js
  │ extracts user_id from call.request
  │ queries RxDB: find all reservations where user_id matches
  │ maps results to ReservationSummary objects
  │ calls callback(null, { reservations })
  │
  ▼
[9] reservation-service/src/db/database.js
  │ RxDB find({ selector: { user_id } }).exec()
  │ returns matching reservation documents
  │ each doc.toJSON() converts to plain object
  │
  ▼
[8] reservation-service/src/handlers/reservationHandlers.js
  │ callback(null, { reservations: [...] })
  │ response serialized to Protobuf binary
  │ sent back over HTTP/2 to api-gateway
  │
  ▼
[5] api-gateway/src/grpc/clients.js
  │ Promise resolves with { reservations: [...] }
  │
  ▼
[4] api-gateway/src/graphql/resolvers.js
  │ resolver returns result.reservations array
  │
  ▼
[2] api-gateway/src/graphql/schema.js
  │ graphql-http filters the response
  │ ONLY returns fields the client asked for: id, date, status
  │ drops party_size, table_id, user_id (not requested)
  │
  ▼
POSTMAN receives:
{
  "data": {
    "getUserReservations": [
      {
        "id": "res-123",
        "date": "2026-06-01",
        "status": "confirmed"
      }
    ]
  }
}
```

### File Roles Summary

| File                                                      | Role                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| `api-gateway/src/index.js`                                | Receives HTTP POST, routes /graphql to graphql-http handler |
| `api-gateway/src/graphql/schema.js`                       | Validates query, defines available types and fields         |
| `api-gateway/src/graphql/resolvers.js`                    | Executes the query logic, calls gRPC                        |
| `api-gateway/src/grpc/clients.js`                         | Serializes and sends gRPC request to reservation-service    |
| `proto/reservation.proto`                                 | Contract — defines binary structure for both sides          |
| `reservation-service/src/index.js`                        | gRPC server on port 50053, routes to handlers               |
| `reservation-service/src/handlers/reservationHandlers.js` | Queries RxDB, returns results                               |
| `reservation-service/src/db/database.js`                  | RxDB in-memory database with JSON persistence               |

---

## Key Differences — REST vs GraphQL flow

| Step                 | REST flow                           | GraphQL flow                     |
| -------------------- | ----------------------------------- | -------------------------------- |
| **Entry point**      | `/api/users/register`               | `/graphql`                       |
| **Routing**          | Express router matches URL + method | graphql-http parses query string |
| **Validation**       | Manual in handler                   | Automatic by schema              |
| **Field filtering**  | Returns everything                  | Returns only requested fields    |
| **Data format**      | JSON in, JSON out                   | JSON in, JSON out                |
| **Internal calls**   | Same — gRPC to microservices        | Same — gRPC to microservices     |
| **Response wrapper** | Raw JSON object                     | Wrapped in `{ "data": { ... } }` |
