import { createClient } from 'redis'

const REDIS_URL = process.env.EXPO_PUBLIC_REDIS_URL

if (!REDIS_URL) {
  throw new Error('Missing REDIS_URL in .env.local')
}

const redisClient = createClient({
  url: REDIS_URL,
})

redisClient.on('error', (err) => console.error('Redis error:', err))

export async function connectRedis() {
  try {
    await redisClient.connect()
    await redisClient.ping()
    console.log('✓ Redis connection OK')
    return redisClient
  } catch (err) {
    console.error('✗ Redis connection failed:', err)
    return null
  }
}

export async function storeGPSPing(userId: string, data: any) {
  const key = `gps:${userId}:${Date.now()}`
  await redisClient.set(key, JSON.stringify(data), {
    EX: 3600,
  })
}

export default redisClient
