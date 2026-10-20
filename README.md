# rn-outbox-chat

A small React Native (Expo, TypeScript) chat app that shows how to keep messaging usable on an unreliable network.

## What it demonstrates
- **Redux Toolkit** state for messages and their delivery status (`queued`, `sending`, `sent`, `failed`).
- **Outbox queue**: a message is stored first and sent in the background. If the send fails, it is retried with
  **exponential backoff** (1s, 2s, 4s, 8s, capped), then marked `failed` with a tap-to-retry.
- **Idempotent messages**: every message has a client-generated id, so a retried send can be recognised and ignored by the server.
  The mock server acknowledges a duplicate id but does not reply twice, and the reducer ignores duplicate incoming ids.
- **Swappable transport**: the app talks to a `Transport` interface. `MockTransport` simulates a socket so the app runs
  with no server. To use a real WebSocket, implement `Transport` around `new WebSocket(url)`.
- Accessibility labels on the main controls.

## Run it
```bash
npm install
npx expo start      # then press a / i, or scan the QR code with Expo Go
```
Flip the **Offline** switch, send a few messages, and watch them retry. Switch back online and they deliver.

## Checks
```bash
npm run typecheck
npm test
```

## Structure
```
App.tsx                    wires store, transport and outbox
src/store/                 Redux Toolkit slice and typed hooks
src/outbox/backoff.ts      backoff delay function
src/outbox/outbox.ts       queue and retry logic
src/services/transport.ts  Transport interface and MockTransport
src/screens/ChatScreen.tsx UI
__tests__/                 unit tests (backoff, outbox retries, reducer)
```
