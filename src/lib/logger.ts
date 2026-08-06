import pino from "pino";

const logLevel =
  typeof process !== "undefined" && process.env.LOG_LEVEL
    ? process.env.LOG_LEVEL
    : "info";

const logger = pino({
  base: {
    name: "presonus-studiolive-midi-integration",
  },
  level: logLevel,
});

export default logger;
