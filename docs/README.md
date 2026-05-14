# Kafka Topics Documentation

## Broker
- Host: `localhost:9092`
- Managed via Docker Compose

## Topics

### `reservation.created`
- **Producer:** `reservation-service`
- **Consumer:** `restaurant-service`
- **Trigger:** A user successfully creates a new reservation
- **Payload:**
```json
  {
    "reservationId": "string",
    "restaurantId": "string",
    "tableId": "string",
    "userId": "string",
    "date": "ISO8601 string",
    "partySize": "number"
  }
```

### `reservation.cancelled`
- **Producer:** `reservation-service`
- **Consumer:** `restaurant-service`
- **Trigger:** A user cancels an existing reservation
- **Payload:**
```json
  {
    "reservationId": "string",
    "tableId": "string",
    "date": "ISO8601 string"
  }
```

### `table.availability.updated`
- **Producer:** `restaurant-service`
- **Consumer:** `reservation-service`
- **Trigger:** A table's availability changes (after booking or cancellation)
- **Payload:**
```json
  {
    "tableId": "string",
    "restaurantId": "string",
    "isAvailable": "boolean",
    "date": "ISO8601 string"
  }
```

## Flow Summary

```
User books table
    → reservation-service creates reservation
    → Kafka: reservation.created
    → restaurant-service marks table as unavailable
    → Kafka: table.availability.updated
    → reservation-service confirms updated status

User cancels booking
    → reservation-service cancels reservation
    → Kafka: reservation.cancelled
    → restaurant-service marks table as available again
    → Kafka: table.availability.updated
```