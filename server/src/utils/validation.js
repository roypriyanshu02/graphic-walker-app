const path = require('path');
const config = require('../config');

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const validation = {
  // File validation
  validateFile(file) {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.upload.allowedTypes.includes(ext)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`,
        'file'
      );
    }

    return true;
  },

  // Dataset validation
  validateDataset(dataset) {
    const required = ['datasetName'];
    const missing = required.filter(field => !dataset[field]);
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0]
      );
    }

    if (typeof dataset.datasetName !== 'string' || dataset.datasetName.trim().length === 0) {
      throw new ValidationError('Dataset name must be a non-empty string', 'datasetName');
    }

    return true;
  },

  // Dashboard validation
  validateDashboard(dashboard) {
    const required = ['dashboardName', 'datasetName'];
    const missing = required.filter(field => !dashboard[field]);
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0]
      );
    }

    if (typeof dashboard.dashboardName !== 'string' || dashboard.dashboardName.trim().length === 0) {
      throw new ValidationError('Dashboard name must be a non-empty string', 'dashboardName');
    }

    return true;
  },

  // CSV query validation
  validateCsvQuery(query) {
    const { csvPath, page, limit } = query;

    if (!csvPath) {
      throw new ValidationError('CSV path is required', 'csvPath');
    }

    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new ValidationError('Page must be a positive integer', 'page');
      }
    }

    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > config.csv.maxPageSize) {
        throw new ValidationError(
          `Limit must be between 1 and ${config.csv.maxPageSize}`,
          'limit'
        );
      }
    }

    return true;
  }
};

module.exports = { validation, ValidationError };
