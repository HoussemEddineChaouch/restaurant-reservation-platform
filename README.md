# Restaurant Reservation Platform

A smart restaurant table reservation platform built with a **Node.js microservices architecture**.

## Architecture

| Component               | Role                               | Communication  |
| ----------------------- | ---------------------------------- | -------------- |
| **API Gateway**         | Single entry point for clients     | REST + GraphQL |
| **User Service**        | User registration & authentication | gRPC + SQLite3 |
| **Restaurant Service**  | Restaurants, tables & availability | gRPC + SQLite3 |
| **Reservation Service** | Bookings & cancellations           | gRPC + RxDB    |
| **Kafka Broker**        | Async event-driven communication   | Kafka topics   |

## Communication Protocols

- **REST** — CRUD operations via API Gateway
- **GraphQL** — Flexible queries via API Gateway
- **gRPC** — Internal communication between Gateway and microservices
- **Kafka** — Async events between microservices

## Tech Stack

- Node.js
- gRPC + Protocol Buffers
- Apache Kafka (via Docker)
- SQLite3 / RxDB
- Express.js + Apollo Server

## Getting Started

> Installation and run instructions coming in next steps.

## Project Structure

## Author

- [HoussemEddineChaouch](https://github.com/HoussemEddineChaouch)
