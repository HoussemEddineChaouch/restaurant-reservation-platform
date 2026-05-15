const { Kafka } = require("kafkajs");
const { getDb, saveDb } = require("../db/database");
const { v4: uuidv4 } = require("uuid");

const kafka = new Kafka({
  clientId: "restaurant-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "restaurant-service-group" });

const startConsumer = async () => {
  await consumer.connect();

  // Subscribe to both reservation topics
  await consumer.subscribe({
    topic: "reservation.created",
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: "reservation.cancelled",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      const db = getDb();

      if (topic === "reservation.created") {
        console.log(
          `[RestaurantService] Kafka: reservation.created received for table ${data.tableId}`,
        );

        // Mark table as unavailable on that date
        const id = uuidv4();
        db.run(`
          INSERT INTO table_availability (id, table_id, date, is_available)
          VALUES ('${id}', '${data.tableId}', '${data.date}', 0)
          ON CONFLICT(table_id, date) DO UPDATE SET is_available = 0
        `);
        saveDb();
      }

      if (topic === "reservation.cancelled") {
        console.log(
          `[RestaurantService] Kafka: reservation.cancelled received for table ${data.tableId}`,
        );

        // Mark table as available again on that date
        db.run(`
          UPDATE table_availability
          SET is_available = 1
          WHERE table_id = '${data.tableId}' AND date = '${data.date}'
        `);
        saveDb();
      }
    },
  });

  console.log("[RestaurantService] Kafka consumer started");
};

module.exports = { startConsumer };
