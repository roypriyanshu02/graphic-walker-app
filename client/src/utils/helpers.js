import { UI_CONSTANTS, DATA_CONSTANTS } from '../constants';

// File utilities
export const fileUtils = {
  // Validate file type
  isValidFileType: (file, allowedTypes = UI_CONSTANTS.FILE_UPLOAD.ACCEPTED_TYPES) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileExtension);
  },

  // Validate file size
  isValidFileSize: (file, maxSize = UI_CONSTANTS.FILE_UPLOAD.MAX_SIZE) => {
    return file.size <= maxSize;
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }
};

// Data processing utilities
export const dataUtils = {
  // Detect field type based on values
  detectFieldType: (values) => {
    if (!values || values.length === 0) return DATA_CONSTANTS.FIELD_TYPES.NOMINAL;
    
    // Filter out null/undefined values
    const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (validValues.length === 0) return DATA_CONSTANTS.FIELD_TYPES.NOMINAL;
    
    // Check if all values are numbers
    const numericValues = validValues.filter(v => !isNaN(Number(v)));
    if (numericValues.length === validValues.length) {
      return DATA_CONSTANTS.FIELD_TYPES.QUANTITATIVE;
    }
    
    // Check if values look like dates
    const dateValues = validValues.filter(v => !isNaN(Date.parse(v)));
    if (dateValues.length === validValues.length) {
      return DATA_CONSTANTS.FIELD_TYPES.TEMPORAL;
    }
    
    // Check if it's ordinal (limited unique values)
    const uniqueValues = [...new Set(validValues)];
    if (uniqueValues.length <= 10 && uniqueValues.length < validValues.length * 0.5) {
      return DATA_CONSTANTS.FIELD_TYPES.ORDINAL;
    }
    
    return DATA_CONSTANTS.FIELD_TYPES.NOMINAL;
  },

  // Convert CSV data to GraphicWalker format
  convertToGraphicWalkerFormat: (data) => {
    if (!data || data.length === 0) return { dataSource: [], fields: [] };
    
    const dataSource = data.map((row, index) => ({
      ...row,
      __id: index
    }));
    
    const fields = Object.keys(data[0]).map(key => {
      const values = data.map(row => row[key]);
      const fieldType = dataUtils.detectFieldType(values);
      
      return {
        fid: key,
        name: key,
        semanticType: fieldType,
        analyticType: fieldType === DATA_CONSTANTS.FIELD_TYPES.QUANTITATIVE ? 'measure' : 'dimension'
      };
    });
    
    return { dataSource, fields };
  },

  // Clean and normalize data
  cleanData: (data) => {
    if (!Array.isArray(data)) return [];
    
    return data.map(row => {
      const cleanedRow = {};
      Object.keys(row).forEach(key => {
        let value = row[key];
        
        // Handle null/undefined/empty values
        if (value === null || value === undefined || value === '') {
          cleanedRow[key] = null;
          return;
        }
        
        // Try to convert to number if it looks like a number
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          const numValue = Number(value);
          cleanedRow[key] = numValue;
        } else {
          cleanedRow[key] = value;
        }
      });
      return cleanedRow;
    });
  }
};

// String utilities
export const stringUtils = {
  // Truncate string
  truncate: (str, length = 50) => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Convert to title case
  toTitleCase: (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate slug from string
  slugify: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
};

// Date utilities
export const dateUtils = {
  // Format date for display
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  },

  // Get relative time
  getRelativeTime: (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
};

// Validation utilities
export const validationUtils = {
  // Validate required field
  isRequired: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate dataset name
  isValidDatasetName: (name) => {
    if (!name || name.trim().length === 0) return false;
    if (name.length > 100) return false;
    // Allow letters, numbers, spaces, hyphens, underscores
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    return nameRegex.test(name);
  },

  // Validate dashboard name
  isValidDashboardName: (name) => {
    return validationUtils.isValidDatasetName(name);
  }
};

// Debounce utility
export const debounce = (func, delay = UI_CONSTANTS.DEBOUNCE_DELAY) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Local storage utilities
export const storageUtils = {
  // Get item from localStorage
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  // Set item in localStorage
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  // Remove item from localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

// Error handling utilities
export const errorUtils = {
  // Extract error message
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'An unexpected error occurred';
  },

  // Log error
  logError: (error, context = '') => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  }
};
