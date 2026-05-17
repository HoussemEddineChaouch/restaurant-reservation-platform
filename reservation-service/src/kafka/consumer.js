const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "reservation-service-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "reservation-service-group",
});

const startConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "table.availability.updated",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());

      console.log(
        `[ReservationService] Kafka: table.availability.updated received —`,
        `table ${data.tableId} is now ${data.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}`,
        `on ${data.date}`,
      );
    },
  });

  console.log(
    "[ReservationService] Kafka consumer started for table.availability.updated",
  );
};

module.exports = { startConsumer };
