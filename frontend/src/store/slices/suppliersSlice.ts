import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Supplier {
  id: string;
  companyName: string;
  tradeName?: string;
  email: string;
  phone?: string;
  countryId?: string;
  preferredLanguage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersState {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Initial state
const initialState: SuppliersState = {
  suppliers: [],
  selectedSupplier: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
};

// Async thunks
export const fetchSuppliers = createAsyncThunk(
  'suppliers/fetchSuppliers',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/suppliers?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch suppliers');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Create slice
const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSupplier: (state, action: PayloadAction<Supplier | null>) => {
      state.selectedSupplier = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setSelectedSupplier } = suppliersSlice.actions;

// Export reducer
export default suppliersSlice.reducer;

// Selectors
export const selectSuppliers = (state: { suppliers: SuppliersState }) => state.suppliers.suppliers;
export const selectSelectedSupplier = (state: { suppliers: SuppliersState }) => state.suppliers.selectedSupplier;
export const selectSuppliersLoading = (state: { suppliers: SuppliersState }) => state.suppliers.loading;
export const selectSuppliersError = (state: { suppliers: SuppliersState }) => state.suppliers.error;