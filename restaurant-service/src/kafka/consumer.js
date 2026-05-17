const { Kafka } = require("kafkajs");
const { getDb, saveDb } = require("../db/database");
const { v4: uuidv4 } = require("uuid");

const kafka = new Kafka({
  clientId: "restaurant-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "restaurant-service-group" });
const producer = kafka.producer();

const startConsumer = async () => {
  await consumer.connect();
  await producer.connect();

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

        const id = uuidv4();
        db.run(`
          INSERT INTO table_availability (id, table_id, date, is_available)
          VALUES ('${id}', '${data.tableId}', '${data.date}', 0)
          ON CONFLICT(table_id, date) DO UPDATE SET is_available = 0
        `);
        saveDb();

        await producer.send({
          topic: "table.availability.updated",
          messages: [
            {
              value: JSON.stringify({
                tableId: data.tableId,
                restaurantId: data.restaurantId,
                isAvailable: false,
                date: data.date,
              }),
            },
          ],
        });
        console.log(
          `[RestaurantService] Kafka: table.availability.updated published for table ${data.tableId}`,
        );
      }

      if (topic === "reservation.cancelled") {
        console.log(
          `[RestaurantService] Kafka: reservation.cancelled received for table ${data.tableId}`,
        );

        db.run(`
          UPDATE table_availability
          SET is_available = 1
          WHERE table_id = '${data.tableId}' AND date = '${data.date}'
        `);
        saveDb();

        await producer.send({
          topic: "table.availability.updated",
          messages: [
            {
              value: JSON.stringify({
                tableId: data.tableId,
                restaurantId: data.restaurantId,
                isAvailable: true,
                date: data.date,
              }),
            },
          ],
        });
        console.log(
          `[RestaurantService] Kafka: table.availability.updated published for table ${data.tableId}`,
        );
      }
    },
  });

  console.log("[RestaurantService] Kafka consumer started");
};

module.exports = { startConsumer };
