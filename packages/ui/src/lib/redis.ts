import Redis, { RedisOptions } from "ioredis"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

const redisOptions: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  connectTimeout: 5000,
  reconnectOnError: (err) => {
    const targetError = "READONLY"
    if (err.message.includes(targetError)) {
      return true
    }
    return false
  },
}

const createRedisClient = () => {
  const client = new Redis(redisUrl, redisOptions)

  client.on("error", (error) => {
    // Catching error event prevents "Unhandled error event" which crashes the process
    console.warn("[Redis] Connection error:", error.message)
  })

  return client
}

const globalForRedis = global as unknown as { redis: Redis | undefined }

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
