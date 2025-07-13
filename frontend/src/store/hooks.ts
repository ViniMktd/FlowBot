import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hooks for common actions
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  
  return {
    ...auth,
    dispatch,
  };
};

export const useOrders = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(state => state.orders);
  
  return {
    ...orders,
    dispatch,
  };
};

export const useCustomers = () => {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(state => state.customers);
  
  return {
    ...customers,
    dispatch,
  };
};

export const useSuppliers = () => {
  const dispatch = useAppDispatch();
  const suppliers = useAppSelector(state => state.suppliers);
  
  return {
    ...suppliers,
    dispatch,
  };
};

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.notifications);
  
  return {
    ...notifications,
    dispatch,
  };
};

export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(state => state.ui);
  
  return {
    ...ui,
    dispatch,
  };
};

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(state => state.dashboard);
  
  return {
    ...dashboard,
    dispatch,
  };
};