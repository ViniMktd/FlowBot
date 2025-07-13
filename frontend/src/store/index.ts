import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { 
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Import slices
import authSlice from './slices/authSlice';
import ordersSlice from './slices/ordersSlice';
import customersSlice from './slices/customersSlice';
import suppliersSlice from './slices/suppliersSlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';
import dashboardSlice from './slices/dashboardSlice';

// Create root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  orders: ordersSlice,
  customers: customersSlice,
  suppliers: suppliersSlice,
  notifications: notificationSlice,
  ui: uiSlice,
  dashboard: dashboardSlice,
});

// Persist configuration
const persistConfig = {
  key: 'flowbot',
  storage,
  version: 1,
  whitelist: ['auth', 'ui'], // Only persist auth and UI preferences
  blacklist: ['orders', 'customers', 'suppliers', 'notifications', 'dashboard'], // Don't persist dynamic data
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store and persistor
export default store;