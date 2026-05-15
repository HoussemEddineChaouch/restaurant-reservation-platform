const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "reservation-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log("[ReservationService] Kafka producer connected");
};

const publishEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  console.log(
    `[ReservationService] Kafka event published to ${topic}:`,
    message,
  );
};

module.exports = { connectProducer, publishEvent };
