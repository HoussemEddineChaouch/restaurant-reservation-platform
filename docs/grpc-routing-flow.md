# 🔌 Detailed gRPC Routing Flow

This document traces exactly how a request travels from the API Gateway
through grpcCall() to the microservice, file by file.

---

## The 3 things grpcCall needs

| Parameter | What it is   | Example                     |
| --------- | ------------ | --------------------------- |
| `client`  | Who to call  | `userClient` → port 50051   |
| `method`  | What to call | `'RegisterUser'` from proto |
| `request` | What to send | `req.body` from Postman     |

---

## Complete Routing Flow

```
POST /api/users/register { name, email, password }
        │
        ▼
api-gateway/src/index.js
  app.use('/api/users', userRoutes)
  ← matches the PREFIX /api/users
  ← hands request to userRoutes.js
        │
        ▼
api-gateway/src/routes/userRoutes.js
  router.post('/register', ...)
  ← matches the SUFFIX /register
  ← has req.body = { name, email, password }
  ← calls grpcCall(userClient, 'RegisterUser', req.body)
        │
        ▼
api-gateway/src/grpc/clients.js — grpcCall()
  ← userClient     = the connection to port 50051
  ← 'RegisterUser' = the method name from user.proto
  ← req.body       = the data to send
  ← serializes body → Protobuf binary
  ← sends over HTTP/2 to localhost:50051
        │
        ▼
proto/user.proto
  ← defines HOW to encode RegisterUserRequest
  ← { name=1, email=2, password=3, phone=4 }
  ← both sides loaded this file at startup
        │
        ▼
user-service/src/index.js
  server.addService({
    RegisterUser: handlers.registerUser
  })
  ← gRPC server receives the call on port 50051
  ← maps method name RegisterUser → handler function
        │
        ▼
user-service/src/handlers/userHandlers.js
  registerUser(call, callback)
  ← call.request = { name, email, password }
  ← validates fields
  ← checks duplicate email
  ← hashes password with bcrypt
  ← generates UUID
  ← saves to SQLite3 via database.js
  ← callback(null, { id, name, email, message })
        │
        ▼
user-service/src/db/database.js
  db.run(INSERT INTO users...)
  saveDb() → persists to users.db
        │
        ▼
response travels back up:
  handler → index.js → clients.js (Promise resolves)
  → userRoutes.js → res.status(201).json(result)
        │
        ▼
POSTMAN receives:
{
  "id": "abc-123",
  "name": "Houssem",
  "email": "houssem@test.com",
  "message": "User registered successfully"
}
```

---

## Why this routing works

```
index.js           userRoutes.js        clients.js
─────────────      ─────────────        ──────────────────────
/api/users    →    /register       →    grpcCall(
(prefix)           (suffix)               userClient,     ← who
                                          'RegisterUser', ← what (from proto)
                                          req.body        ← data
                                        )
```

```
proto/user.proto        user-service/index.js     userHandlers.js
────────────────        ─────────────────────     ───────────────
defines contract   →    loads same proto      →   implements logic
RegisterUser()          addService({               registerUser()
RegisterUserRequest       RegisterUser:              call.request
RegisterUserResponse      handlers.registerUser      callback()
                        })
```

---

## File Roles in this flow

| File                                        | Role                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| `api-gateway/src/index.js`                  | Receives HTTP request, matches PREFIX /api/users       |
| `api-gateway/src/routes/userRoutes.js`      | Matches SUFFIX /register, calls grpcCall()             |
| `api-gateway/src/grpc/clients.js`           | Holds client connection, serializes, sends over HTTP/2 |
| `proto/user.proto`                          | Contract loaded by both sides to encode/decode binary  |
| `user-service/src/index.js`                 | gRPC server receives call, maps method to handler      |
| `user-service/src/handlers/userHandlers.js` | Business logic, validates, saves, responds             |
| `user-service/src/db/database.js`           | Writes to SQLite3 memory, persists to disk             |
