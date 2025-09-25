// Application Constants
export const APP_CONFIG = {
  NAME: 'Graphic Walker',
  VERSION: '2.0.0',
  DESCRIPTION: 'Data Visualization and Dashboard Creation Tool'
};

// UI Constants
export const UI_CONSTANTS = {
  TABS: {
    DESIGN: 'design',
    VIEW: 'view'
  },
  
  FILE_UPLOAD: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ACCEPTED_TYPES: ['.csv'],
    ACCEPTED_MIME_TYPES: ['text/csv', 'application/csv', 'text/plain']
  },
  
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    PAGE_SIZE_OPTIONS: [25, 50, 100, 200],
    MAX_PAGE_SIZE: 1000
  },
  
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  }
};

// Data Processing Constants
export const DATA_CONSTANTS = {
  FIELD_TYPES: {
    QUANTITATIVE: 'quantitative',
    ORDINAL: 'ordinal',
    NOMINAL: 'nominal',
    TEMPORAL: 'temporal'
  },
  
  CHART_TYPES: {
    BAR: 'bar',
    LINE: 'line',
    SCATTER: 'scatter',
    PIE: 'pie',
    HISTOGRAM: 'histogram',
    HEATMAP: 'heatmap'
  },
  
  AGGREGATIONS: {
    COUNT: 'count',
    SUM: 'sum',
    AVERAGE: 'average',
    MIN: 'min',
    MAX: 'max'
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  THEME: 'gw_theme',
  LAST_DATASET: 'gw_last_dataset',
  USER_PREFERENCES: 'gw_user_preferences',
  RECENT_DASHBOARDS: 'gw_recent_dashboards'
};

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Export all constants
export * from './api';
export * from './messages';
