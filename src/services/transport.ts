export interface OutgoingPayload {
  /** Client-generated id. The server can use it to ignore duplicates (idempotency). */
  id: string;
  text: string;
}

export interface IncomingMessage {
  id: string;
  text: string;
  from: string;
}

export interface Transport {
  send(payload: OutgoingPayload): Promise<void>;
  onMessage(handler: (msg: IncomingMessage) => void): () => void;
}

/**
 * In-memory stand-in for a WebSocket connection so the app runs without a server.
 * - When `online` is false, send() rejects (like a dropped connection).
 * - The "server" remembers ids it has seen, so a retried message is acknowledged
 *   but never produces a duplicate reply.
 * To use a real socket, implement `Transport` around `new WebSocket(url)`.
 */
export class MockTransport implements Transport {
  online = true;
  private seen = new Set<string>();
  private handlers = new Set<(msg: IncomingMessage) => void>();

  constructor(private latencyMs = 300) {}

  send(payload: OutgoingPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.online) {
          reject(new Error('Network unavailable'));
          return;
        }
        resolve();
        if (this.seen.has(payload.id)) return; // duplicate: acknowledge, do not reply again
        this.seen.add(payload.id);
        setTimeout(() => {
          this.handlers.forEach((h) =>
            h({ id: `reply-${payload.id}`, text: `Vendor received: "${payload.text}"`, from: 'Vendor' }),
          );
        }, 800);
      }, this.latencyMs);
    });
  }

  onMessage(handler: (msg: IncomingMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
