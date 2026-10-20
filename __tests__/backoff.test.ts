import { backoffDelay } from '../src/outbox/backoff';

describe('backoffDelay', () => {
  it('doubles each attempt: 1s, 2s, 4s, 8s', () => {
    expect([0, 1, 2, 3].map((a) => backoffDelay(a))).toEqual([1000, 2000, 4000, 8000]);
  });

  it('never exceeds the cap', () => {
    expect(backoffDelay(10)).toBe(30000);
    expect(backoffDelay(5, 1000, 10000)).toBe(10000);
  });
});
