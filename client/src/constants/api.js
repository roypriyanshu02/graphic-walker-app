// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API Endpoints
export const ENDPOINTS = {
  // Dashboard endpoints
  DASHBOARDS: '/Dashboard',
  DASHBOARD_BY_NAME: (name) => `/Dashboard/${encodeURIComponent(name)}`,
  DASHBOARD_STATS: '/Dashboard/stats',

  // Dataset endpoints
  DATASETS: '/Dataset',
  DATASET_UPLOAD: '/Dataset/upload',
  DATASET_BY_NAME: (name) => `/Dataset/${encodeURIComponent(name)}`,
  DATASET_DATA: (name) => `/Dataset/${encodeURIComponent(name)}/data`,
  DATASET_INFO: (name) => `/Dataset/${encodeURIComponent(name)}/info`,

  // CSV endpoints
  CSV_READ: '/api/csv/read',
  CSV_INFO: '/api/csv/info',
  CSV_COLUMNS: '/api/csv/columns',
  CSV_PAGINATED: '/api/csv/paginated',
  CSV_STATS: '/api/csv/stats',

  // Utility endpoints
  HEALTH: '/health'
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000;
