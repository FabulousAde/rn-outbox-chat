import { configureStore } from '@reduxjs/toolkit';
import chat from './chatSlice';

export const makeStore = () => configureStore({ reducer: { chat } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
