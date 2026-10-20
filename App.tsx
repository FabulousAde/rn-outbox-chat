import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import ChatScreen from './src/screens/ChatScreen';
import { Outbox } from './src/outbox/outbox';
import { MockTransport } from './src/services/transport';
import { makeStore } from './src/store';
import { messageReceived } from './src/store/chatSlice';

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export default function App() {
  const { store, transport, outbox } = useMemo(() => {
    const store = makeStore();
    const transport = new MockTransport();
    const outbox = new Outbox(store, transport);
    return { store, transport, outbox };
  }, []);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const off = transport.onMessage((m) => store.dispatch(messageReceived(m)));
    return () => {
      off();
      outbox.dispose();
    };
  }, [store, transport, outbox]);

  return (
    <Provider store={store}>
      <ChatScreen
        online={online}
        onToggleOnline={(v) => {
          transport.online = v;
          setOnline(v);
        }}
        onSend={(text) => outbox.enqueue(newId(), text)}
        onRetry={(id) => outbox.retryNow(id)}
      />
      <StatusBar style="auto" />
    </Provider>
  );
}
