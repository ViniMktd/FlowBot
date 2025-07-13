import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface UIState {
  theme: 'light' | 'dark';
  language: 'pt-BR' | 'en' | 'zh-CN';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  loading: boolean;
  pageTitle: string;
  breadcrumbs: Array<{
    label: string;
    path?: string;
  }>;
  modals: {
    [key: string]: boolean;
  };
  selectedTab: string;
  tableSettings: {
    [key: string]: {
      pageSize: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      columns: string[];
    };
  };
}

// Initial state
const initialState: UIState = {
  theme: 'light',
  language: 'pt-BR',
  sidebarOpen: true,
  sidebarCollapsed: false,
  loading: false,
  pageTitle: 'FlowBot',
  breadcrumbs: [],
  modals: {},
  selectedTab: '',
  tableSettings: {},
};

// Create slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'pt-BR' | 'en' | 'zh-CN'>) => {
      state.language = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    setSelectedTab: (state, action: PayloadAction<string>) => {
      state.selectedTab = action.payload;
    },
    setTableSettings: (state, action: PayloadAction<{ 
      table: string; 
      settings: Partial<UIState['tableSettings']['']> 
    }>) => {
      const { table, settings } = action.payload;
      state.tableSettings[table] = {
        ...state.tableSettings[table],
        ...settings,
      };
    },
    resetTableSettings: (state, action: PayloadAction<string>) => {
      delete state.tableSettings[action.payload];
    },
    resetUI: (state) => {
      state.sidebarOpen = true;
      state.sidebarCollapsed = false;
      state.loading = false;
      state.pageTitle = 'FlowBot';
      state.breadcrumbs = [];
      state.modals = {};
      state.selectedTab = '';
    },
  },
});

// Export actions
export const { 
  setTheme, 
  setLanguage, 
  setSidebarOpen, 
  setSidebarCollapsed, 
  toggleSidebar, 
  toggleSidebarCollapsed, 
  setLoading, 
  setPageTitle, 
  setBreadcrumbs, 
  openModal, 
  closeModal, 
  toggleModal, 
  setSelectedTab, 
  setTableSettings, 
  resetTableSettings, 
  resetUI 
} = uiSlice.actions;

// Export reducer
export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectSelectedTab = (state: { ui: UIState }) => state.ui.selectedTab;
export const selectTableSettings = (state: { ui: UIState }) => state.ui.tableSettings;