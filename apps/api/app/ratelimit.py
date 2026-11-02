"""Per-project token bucket in Redis. Fails open: if Redis is down, ingest keeps working."""

import logging
import time
from functools import lru_cache
from typing import Protocol

from app.config import get_settings

logger = logging.getLogger(__name__)

# KEYS[1] bucket key; ARGV: rate per second, burst, now (seconds, float).
_TOKEN_BUCKET = """
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local rate = tonumber(ARGV[1])
local burst = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local tokens = tonumber(data[1]) or burst
local ts = tonumber(data[2]) or now
tokens = math.min(burst, tokens + (now - ts) * rate)
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.ceil(burst / rate) + 60)
return allowed
"""


class RateLimiter(Protocol):
    def allow(self, key: str) -> bool: ...


class RedisRateLimiter:
    def __init__(self) -> None:
        import redis

        settings = get_settings()
        self.rate = settings.rate_limit_per_second
        self.burst = settings.rate_limit_burst
        self.client = redis.Redis.from_url(
            settings.redis_url, socket_timeout=0.2, socket_connect_timeout=0.2
        )
        self.script = self.client.register_script(_TOKEN_BUCKET)

    def allow(self, key: str) -> bool:
        try:
            return bool(
                self.script(keys=[f"ratelimit:{key}"], args=[self.rate, self.burst, time.time()])
            )
        except Exception:
            logger.warning("Rate limiter unavailable; allowing request")
            return True


class AllowAllRateLimiter:
    def allow(self, key: str) -> bool:
        return True


@lru_cache
def get_rate_limiter() -> RateLimiter:
    return RedisRateLimiter()
