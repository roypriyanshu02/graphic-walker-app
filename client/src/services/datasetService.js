import { api } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

class DatasetService {
  // Get all datasets
  async getDatasets() {
    const response = await api.get(ENDPOINTS.DATASETS);
    return response.success ? response.data : [];
  }

  // Get dataset by name
  async getDatasetByName(name) {
    const response = await api.get(ENDPOINTS.DATASET_BY_NAME(name));
    return response.success ? response.data : null;
  }

  // Get dataset data with optional pagination
  async getDatasetData(name, page = null, limit = null) {
    const params = {};
    if (page !== null) params.page = page;
    if (limit !== null) params.limit = limit;
    
    const response = await api.get(ENDPOINTS.DATASET_DATA(name), params);
    return response.success ? response.data : null;
  }

  // Get dataset file information
  async getDatasetInfo(name) {
    const response = await api.get(ENDPOINTS.DATASET_INFO(name));
    return response.success ? response.data : null;
  }

  // Save/create dataset
  async saveDataset(dataset) {
    const response = await api.post(ENDPOINTS.DATASETS, dataset);
    return response.success ? response.data : null;
  }

  // Upload dataset file
  async uploadDataset(file, datasetName, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetName', datasetName);
    
    const response = await api.upload(ENDPOINTS.DATASET_UPLOAD, formData, onProgress);
    return response.success ? response.data : null;
  }

  // Delete dataset
  async deleteDataset(name) {
    const response = await api.delete(ENDPOINTS.DATASET_BY_NAME(name));
    return response.success;
  }

  // Check if dataset exists
  async datasetExists(name) {
    try {
      const dataset = await this.getDatasetByName(name);
      return dataset !== null;
    } catch (error) {
      if (error.message.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  // Get dataset statistics
  async getDatasetStats(name) {
    try {
      const info = await this.getDatasetInfo(name);
      const sampleData = await this.getDatasetData(name, 1, 5);
      
      return {
        ...info.fileInfo,
        sampleData: sampleData?.records || [],
        recordCount: sampleData?.recordCount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get dataset statistics: ${error.message}`);
    }
  }

  // Validate dataset before upload
  validateDataset(file, datasetName) {
    const errors = [];
    
    // Validate file
    if (!file) {
      errors.push('No file selected');
    } else {
      // Check file type
      const allowedTypes = ['.csv'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        errors.push('Only CSV files are allowed');
      }
      
      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push('File size exceeds 50MB limit');
      }
    }
    
    // Validate dataset name
    if (!datasetName || datasetName.trim().length === 0) {
      errors.push('Dataset name is required');
    } else if (datasetName.length > 100) {
      errors.push('Dataset name cannot exceed 100 characters');
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(datasetName)) {
      errors.push('Dataset name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new DatasetService();
