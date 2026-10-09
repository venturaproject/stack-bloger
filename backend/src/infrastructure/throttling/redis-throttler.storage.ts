import { ThrottlerStorage } from '@nestjs/throttler';
import { createClient, RedisClientType } from 'redis';

const INCREMENT_SCRIPT = `
local count_key = KEYS[1]
local block_key = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local block_duration = tonumber(ARGV[3])
local block_ttl = redis.call('PTTL', block_key)

if block_ttl > 0 then
  local count_ttl = redis.call('PTTL', count_key)
  return { limit + 1, math.max(count_ttl, 0), 1, block_ttl }
end

local count = redis.call('INCR', count_key)
if count == 1 then
  redis.call('PEXPIRE', count_key, ttl)
end

local count_ttl = redis.call('PTTL', count_key)
if count > limit then
  redis.call('PSETEX', block_key, block_duration, '1')
  return { count, math.max(count_ttl, 0), 1, block_duration }
end

return { count, math.max(count_ttl, 0), 0, 0 }
`;

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisClientType) {}

  static async connect(url: string): Promise<RedisThrottlerStorage> {
    const client = createClient({ url });
    client.on('error', (error) => console.error('[rate-limit] Redis error:', error.message));
    await client.connect();
    return new RedisThrottlerStorage(client);
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const prefix = `blog:throttle:${throttlerName}:${key}`;
    const result = await this.redis.eval(INCREMENT_SCRIPT, {
      keys: [`${prefix}:count`, `${prefix}:blocked`],
      arguments: [String(ttl), String(limit), String(Math.max(blockDuration, 1))],
    }) as number[];

    return {
      totalHits: Number(result[0]),
      timeToExpire: Math.ceil(Number(result[1]) / 1000),
      isBlocked: Number(result[2]) === 1,
      timeToBlockExpire: Math.ceil(Number(result[3]) / 1000),
    };
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.redis.isOpen) await this.redis.quit();
  }
}
