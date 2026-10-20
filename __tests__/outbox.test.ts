import { Outbox } from '../src/outbox/outbox';
import { makeStore } from '../src/store';
import { messageReceived } from '../src/store/chatSlice';
import type { Transport } from '../src/services/transport';

class FlakyTransport implements Transport {
  sent: string[] = [];
  constructor(public failuresLeft: number) {}
  async send(p: { id: string; text: string }) {
    if (this.failuresLeft > 0) {
      this.failuresLeft--;
      throw new Error('offline');
    }
    this.sent.push(p.id);
  }
  onMessage() {
    return () => {};
  }
}

const flush = () => Promise.resolve().then(() => Promise.resolve());
const status = (store: ReturnType<typeof makeStore>, id: string) =>
  store.getState().chat.messages.find((m) => m.id === id)!;

describe('Outbox', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sends immediately when online', async () => {
    const store = makeStore();
    const t = new FlakyTransport(0);
    new Outbox(store, t).enqueue('a', 'hi');
    await flush();
    expect(status(store, 'a').status).toBe('sent');
    expect(t.sent).toEqual(['a']);
  });

  it('retries after 1s, 2s, 4s and then succeeds', async () => {
    const store = makeStore();
    const t = new FlakyTransport(3);
    new Outbox(store, t).enqueue('a', 'hi');

    await flush();
    expect(status(store, 'a')).toMatchObject({ status: 'queued', attempts: 1, nextRetryInMs: 1000 });

    await jest.advanceTimersByTimeAsync(1000);
    expect(status(store, 'a')).toMatchObject({ status: 'queued', attempts: 2, nextRetryInMs: 2000 });

    await jest.advanceTimersByTimeAsync(2000);
    expect(status(store, 'a')).toMatchObject({ status: 'queued', attempts: 3, nextRetryInMs: 4000 });

    await jest.advanceTimersByTimeAsync(4000);
    expect(status(store, 'a').status).toBe('sent');
    expect(t.sent).toEqual(['a']);
  });

  it('gives up after maxAttempts and allows a manual retry', async () => {
    const store = makeStore();
    const t = new FlakyTransport(100);
    const outbox = new Outbox(store, t, { maxAttempts: 3 });
    outbox.enqueue('a', 'hi');
    await jest.advanceTimersByTimeAsync(10000);
    expect(status(store, 'a')).toMatchObject({ status: 'failed', attempts: 3 });

    t.failuresLeft = 0;
    outbox.retryNow('a');
    await flush();
    expect(status(store, 'a').status).toBe('sent');
  });
});

describe('chat reducer', () => {
  it('ignores a duplicate incoming message id', () => {
    const store = makeStore();
    store.dispatch(messageReceived({ id: 'r1', text: 'hello', from: 'Vendor' }));
    store.dispatch(messageReceived({ id: 'r1', text: 'hello', from: 'Vendor' }));
    expect(store.getState().chat.messages).toHaveLength(1);
  });
});
