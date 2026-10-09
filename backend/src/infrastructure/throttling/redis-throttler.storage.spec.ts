import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'crypto';
import { RedisThrottlerStorage } from './redis-throttler.storage';

test('shares rate-limit hits and blocks requests at the configured limit in Redis', {
  skip: !process.env.REDIS_TEST_URL,
}, async () => {
  const storage = await RedisThrottlerStorage.connect(process.env.REDIS_TEST_URL!);
  const key = `integration-test-${randomUUID()}`;
  try {
    const first = await storage.increment(key, 5000, 2, 5000, 'integration');
    const second = await storage.increment(key, 5000, 2, 5000, 'integration');
    const blocked = await storage.increment(key, 5000, 2, 5000, 'integration');

    assert.equal(first.isBlocked, false);
    assert.equal(second.isBlocked, false);
    assert.equal(blocked.isBlocked, true);
    assert.equal(blocked.totalHits, 3);
    assert.ok(blocked.timeToBlockExpire > 0);
  } finally {
    await storage.onApplicationShutdown();
  }
});
