import type { AppStore } from '../store';
import { gaveUp, manualRetry, messageQueued, retryScheduled, sendStarted, sendSucceeded } from '../store/chatSlice';
import type { Transport } from '../services/transport';
import { backoffDelay } from './backoff';

export interface OutboxOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  capDelayMs?: number;
}

/**
 * Outbox queue: a message is stored first, then sent in the background.
 * If the send fails (network blip) it is retried with exponential backoff
 * (1s, 2s, 4s, 8s ...) instead of failing immediately or hammering the connection.
 */
export class Outbox {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly capDelayMs: number;

  constructor(
    private store: AppStore,
    private transport: Transport,
    options: OutboxOptions = {},
  ) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.capDelayMs = options.capDelayMs ?? 30000;
  }

  enqueue(id: string, text: string): void {
    this.store.dispatch(messageQueued({ id, text }));
    void this.attempt(id);
  }

  retryNow(id: string): void {
    this.clearTimer(id);
    this.store.dispatch(manualRetry(id));
    void this.attempt(id);
  }

  dispose(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  private clearTimer(id: string) {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
  }

  private async attempt(id: string): Promise<void> {
    this.timers.delete(id);
    const msg = this.store.getState().chat.messages.find((m) => m.id === id);
    if (!msg || msg.status === 'sent' || msg.status === 'sending') return;

    this.store.dispatch(sendStarted(id));
    try {
      await this.transport.send({ id, text: msg.text });
      this.store.dispatch(sendSucceeded(id));
    } catch {
      const attempts = msg.attempts + 1;
      if (attempts >= this.maxAttempts) {
        this.store.dispatch(gaveUp({ id, attempts }));
        return;
      }
      const delay = backoffDelay(attempts - 1, this.baseDelayMs, this.capDelayMs);
      this.store.dispatch(retryScheduled({ id, attempts, nextRetryInMs: delay }));
      this.timers.set(id, setTimeout(() => void this.attempt(id), delay));
    }
  }
}
