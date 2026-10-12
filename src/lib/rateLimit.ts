import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Result = { ok: boolean; retryAfter: number };

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const limiters = new Map<string, Ratelimit>();

function redisLimiter(limit: number, windowMs: number) {
  if (!redis) return null;
  const id = `${limit}:${windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `treino:rl:${id}`,
      timeout: 1500,
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

// Per-instance fallback used when Redis is not configured or unreachable.
const hits = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<Result> {
  const limiter = redisLimiter(limit, windowMs);
  if (limiter) {
    try {
      const res = await limiter.limit(key);
      return {
        ok: res.success,
        retryAfter: res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
      };
    } catch {
      // fall through to the in-memory limiter
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
