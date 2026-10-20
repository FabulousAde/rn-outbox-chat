import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  text: string;
  from: 'me' | string;
  status: MessageStatus;
  attempts: number;
  /** Delay before the next automatic retry, for display only. */
  nextRetryInMs?: number;
}

interface ChatState {
  messages: ChatMessage[];
}

const initialState: ChatState = { messages: [] };

const find = (state: ChatState, id: string) => state.messages.find((m) => m.id === id);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    messageQueued(state, action: PayloadAction<{ id: string; text: string }>) {
      state.messages.push({ ...action.payload, from: 'me', status: 'queued', attempts: 0 });
    },
    sendStarted(state, action: PayloadAction<string>) {
      const m = find(state, action.payload);
      if (m) {
        m.status = 'sending';
        m.nextRetryInMs = undefined;
      }
    },
    sendSucceeded(state, action: PayloadAction<string>) {
      const m = find(state, action.payload);
      if (m) m.status = 'sent';
    },
    retryScheduled(state, action: PayloadAction<{ id: string; attempts: number; nextRetryInMs: number }>) {
      const m = find(state, action.payload.id);
      if (m) {
        m.status = 'queued';
        m.attempts = action.payload.attempts;
        m.nextRetryInMs = action.payload.nextRetryInMs;
      }
    },
    gaveUp(state, action: PayloadAction<{ id: string; attempts: number }>) {
      const m = find(state, action.payload.id);
      if (m) {
        m.status = 'failed';
        m.attempts = action.payload.attempts;
        m.nextRetryInMs = undefined;
      }
    },
    manualRetry(state, action: PayloadAction<string>) {
      const m = find(state, action.payload);
      if (m) {
        m.status = 'queued';
        m.attempts = 0;
      }
    },
    messageReceived(state, action: PayloadAction<{ id: string; text: string; from: string }>) {
      if (find(state, action.payload.id)) return; // ignore duplicates from the server
      state.messages.push({ ...action.payload, status: 'sent', attempts: 0 });
    },
  },
});

export const { messageQueued, sendStarted, sendSucceeded, retryScheduled, gaveUp, manualRetry, messageReceived } =
  chatSlice.actions;
export default chatSlice.reducer;
