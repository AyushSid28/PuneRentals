import { Redis } from "@upstash/redis";

const upstashUrl = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
const upstashToken = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

let redis: Redis | null = null;

if (upstashUrl && upstashToken) {
  redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });
} else {
  console.warn("Upstash Redis is not configured. Caching will be disabled.");
}

export function getRedisClient() {
  return redis;
}

export async function fetchWithCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const client = getRedisClient();
  
  if (!client) {
    return fetcher();
  }

  try {
    const cached = await client.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    console.warn(`[Redis] Error fetching key ${key}:`, error);
  }

  const data = await fetcher();

  try {
    if (data !== null) {
      await client.setex(key, ttlSeconds, data);
    }
  } catch (error) {
    console.warn(`[Redis] Error setting key ${key}:`, error);
  }

  return data;
}

export async function invalidateCache(keys: string[]) {
  const client = getRedisClient();
  if (!client || keys.length === 0) return;

  try {
    await client.del(...keys);
  } catch (error) {
    console.warn(`[Redis] Error invalidating keys ${keys.join(", ")}:`, error);
  }
}
