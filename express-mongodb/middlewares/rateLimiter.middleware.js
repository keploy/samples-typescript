import { rateLimit, MemoryStore } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.connect().catch(console.error);

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
    statusCode: 429,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rl:",
    }),
  };

  const finalOptions =
    process.env.NODE_ENV === "production"
      ? { ...defaultOptions, ...options }
      : {
          windowMs: 60 * 1000,
          max: 1000,
          store: new MemoryStore(),
          ...options,
        };

  return rateLimit(finalOptions);
};

const generalRateLimiter = createRateLimiter();

export { generalRateLimiter, createRateLimiter };
