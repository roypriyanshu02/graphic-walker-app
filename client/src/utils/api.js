import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/api';
import { ERROR_MESSAGES } from '../constants/messages';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status}`, {
      url: response.config.url,
      data: response.data
    });
    
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle different error scenarios
    if (error.code === 'ECONNABORTED') {
      error.message = ERROR_MESSAGES.TIMEOUT_ERROR;
    } else if (!error.response) {
      error.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          error.message = data?.message || ERROR_MESSAGES.VALIDATION_FAILED;
          break;
        case 401:
          error.message = ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 403:
          error.message = ERROR_MESSAGES.FORBIDDEN;
          break;
        case 404:
          error.message = ERROR_MESSAGES.NOT_FOUND;
          break;
        case 409:
          error.message = ERROR_MESSAGES.CONFLICT;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          error.message = ERROR_MESSAGES.SERVER_UNAVAILABLE;
          break;
        default:
          error.message = data?.message || ERROR_MESSAGES.FETCH_FAILED;
      }
    }
    
    return Promise.reject(error);
  }
);

// API utility functions
export const api = {
  // Generic GET request
  get: async (url, params = {}) => {
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || ERROR_MESSAGES.FETCH_FAILED);
    }
  },

  // Generic POST request
  post: async (url, data = {}) => {
    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message || ERROR_MESSAGES.SAVE_FAILED);
    }
  },

  // Generic PUT request
  put: async (url, data = {}) => {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message || ERROR_MESSAGES.SAVE_FAILED);
    }
  },

  // Generic DELETE request
  delete: async (url) => {
    try {
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      throw new Error(error.message || ERROR_MESSAGES.DELETE_FAILED);
    }
  },

  // File upload with progress tracking
  upload: async (url, formData, onProgress = null) => {
    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || ERROR_MESSAGES.UPLOAD_FAILED);
    }
  }
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.success === true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;
