// User Messages
export const MESSAGES = {
  // General
  LOADING: 'Loading...',
  ERROR: 'An error occurred',
  SUCCESS: 'Operation completed successfully',
  
  // Data related
  NO_DATA: 'No data available',
  NO_DATA_FOUND: 'No data found',
  DATA_LOADED: 'Data loaded successfully',
  
  // Dataset related
  NO_DATASETS: 'No datasets available',
  SELECT_DATASET: 'Please select a dataset from the dropdown',
  UPLOAD_DATASET: 'Upload a CSV file to create a new dataset',
  DATASET_UPLOADED: 'Dataset uploaded successfully',
  DATASET_EXISTS: 'Dataset already exists. Please choose a different name',
  DATASET_DELETED: 'Dataset deleted successfully',
  
  // Dashboard related
  NO_DASHBOARDS: 'No dashboards saved',
  DASHBOARD_SAVED: 'Dashboard saved successfully',
  DASHBOARD_DELETED: 'Dashboard deleted successfully',
  DASHBOARD_LOADED: 'Dashboard loaded successfully',
  
  // File upload related
  UPLOAD_SUCCESS: 'File uploaded successfully',
  UPLOAD_ERROR: 'Failed to upload file',
  UPLOAD_PROGRESS: 'Uploading file...',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a CSV file',
  CSV_ONLY: 'Please upload only CSV files (.csv)',
  
  // Validation related
  REQUIRED_FIELD: 'This field is required',
  INVALID_INPUT: 'Invalid input provided',
  NAME_TOO_LONG: 'Name is too long',
  
  // Network related
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  
  // CSV specific
  CSV_PROCESSING: 'Processing CSV file...',
  CSV_INVALID: 'Invalid CSV file format',
  CSV_EMPTY: 'CSV file is empty',
  CSV_HEADERS_MISSING: 'CSV file must have headers',
  
  // Pagination
  NO_MORE_DATA: 'No more data to load',
  LOADING_MORE: 'Loading more data...',
  
  // Confirmation
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
  CONFIRM_OVERWRITE: 'This will overwrite the existing item. Continue?',
  
  // Instructions
  DRAG_DROP_FILE: 'Drag and drop a CSV file here, or click to select',
  SELECT_FROM_DROPDOWN: 'Select a dataset from the dropdown above',
  CREATE_VISUALIZATION: 'Create charts and visualizations using the data',
  SAVE_DASHBOARD: 'Save your dashboard to view it later'
};

// Error Messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch data',
  UPLOAD_FAILED: 'Failed to upload file',
  SAVE_FAILED: 'Failed to save',
  DELETE_FAILED: 'Failed to delete',
  LOAD_FAILED: 'Failed to load',
  PARSE_FAILED: 'Failed to parse data',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  SERVER_UNAVAILABLE: 'Server is unavailable'
};
