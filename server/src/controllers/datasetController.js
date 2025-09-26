const dataService = require('../services/dataService');
const csvService = require('../services/csvService');
const logger = require('../utils/logger');
const { validation, ValidationError } = require('../utils/validation');
const path = require('path');
const fs = require('fs');

class DatasetController {
  // GET /Dataset - Get all datasets
  async getDatasets(req, res, next) {
    try {
      logger.info('Fetching all datasets');
      const datasets = await dataService.getDatasets();
      
      res.status(200).json({
        success: true,
        data: datasets,
        count: datasets.length
      });
    } catch (error) {
      logger.error('Failed to retrieve datasets', { error: error.message });
      next(error);
    }
  }

  // POST /Dataset - Save dataset
  async saveDataset(req, res, next) {
    try {
      const dataset = req.body;
      logger.info('Saving dataset', { datasetName: dataset?.datasetName });

      // Validate dataset data
      validation.validateDataset(dataset);

      // Additional validations
      if (dataset.datasetName.length > 100) {
        throw new ValidationError('Dataset name cannot exceed 100 characters', 'datasetName');
      }

      if (dataset.sp && dataset.sp.length > 100) {
        throw new ValidationError('Stored procedure name cannot exceed 100 characters', 'sp');
      }

      // Validate JSON data size (limit to 50MB)
      if (dataset.jsonData) {
        const jsonSize = Buffer.byteLength(typeof dataset.jsonData === 'string' ? dataset.jsonData : JSON.stringify(dataset.jsonData), 'utf8');
        if (jsonSize > 50 * 1024 * 1024) {
          throw new ValidationError('JSON data size cannot exceed 50MB', 'jsonData');
        }
      }

      // Validate JSON data if provided
      if (dataset.jsonData) {
        try {
          // Ensure jsonData is valid JSON
          if (typeof dataset.jsonData === 'string') {
            JSON.parse(dataset.jsonData);
          } else if (!Array.isArray(dataset.jsonData)) {
            throw new Error('JSON data must be an array');
          }
        } catch (jsonError) {
          throw new ValidationError('Invalid JSON data format', 'jsonData');
        }
      }

      const savedDataset = await dataService.saveDataset(dataset);
      
      res.status(200).json({
        success: true,
        message: 'Dataset saved successfully',
        data: savedDataset
      });
    } catch (error) {
      logger.error('Failed to save dataset', { 
        error: error.message,
        datasetName: req.body?.datasetName 
      });
      next(error);
    }
  }

  // POST /Dataset/upload - Upload dataset file
  async uploadDataset(req, res, next) {
    try {
      const file = req.file;
      const { datasetName } = req.body;

      logger.info('Uploading dataset file', { 
        datasetName, 
        fileName: file?.originalname 
      });

      if (!file) {
        throw new ValidationError('No file uploaded', 'file');
      }

      if (!datasetName || datasetName.trim() === '') {
        throw new ValidationError('Dataset name is required', 'datasetName');
      }

      // Validate file
      validation.validateFile(file);

      // Check if dataset with same name already exists
      const existingDataset = await dataService.getDatasetByName(datasetName.trim());
      if (existingDataset) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        throw new ValidationError(`Dataset '${datasetName}' already exists`, 'datasetName');
      }

      // Convert CSV to JSON
      let jsonData = [];
      let headers = [];
      let rowCount = 0;
      let columnCount = 0;

      try {
        jsonData = await csvService.readCsvData(file.path);
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
          rowCount = jsonData.length;
          columnCount = headers.length;
        }
        logger.info('CSV converted to JSON successfully', {
          datasetName: datasetName.trim(),
          rowCount,
          columnCount
        });
      } catch (csvError) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        logger.error('Failed to convert CSV to JSON', { 
          error: csvError.message,
          fileName: file.originalname 
        });
        throw new ValidationError(`Failed to process CSV file: ${csvError.message}`, 'file');
      }

      // Create dataset entry with JSON data
      const dataset = {
        datasetName: datasetName.trim(),
        jsonData: jsonData,
        originalFileName: file.originalname,
        originalFileSize: file.size,
        mimeType: 'application/json',
        rowCount: rowCount,
        columnCount: columnCount,
        headers: headers,
        sp: ''
      };

      const savedDataset = await dataService.saveDataset(dataset);

      // Clean up uploaded file since we've stored the data in the database
      fs.unlinkSync(file.path);
      logger.debug('Cleaned up uploaded CSV file', { filePath: file.path });

      res.status(200).json({
        success: true,
        message: 'File uploaded and converted to JSON successfully',
        data: {
          dataset: savedDataset,
          originalFileName: file.originalname,
          originalFileSize: file.size,
          rowCount: rowCount,
          columnCount: columnCount
        }
      });
    } catch (error) {
      logger.error('Failed to upload dataset', { 
        error: error.message,
        datasetName: req.body?.datasetName,
        fileName: req.file?.originalname
      });
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        logger.debug('Cleaned up uploaded file', { filePath: req.file.path });
      }
      
      next(error);
    }
  }

  // GET /Dataset/:name - Get dataset by name
  async getDatasetByName(req, res, next) {
    try {
      const { name } = req.params;
      logger.info('Fetching dataset by name', { datasetName: name });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dataset name is required', 'name');
      }

      const dataset = await dataService.getDatasetByName(name);

      if (!dataset) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
          message: `Dataset '${name}' not found`
        });
      }

      res.status(200).json({
        success: true,
        data: dataset
      });
    } catch (error) {
      logger.error('Failed to retrieve dataset', { 
        error: error.message,
        datasetName: req.params.name 
      });
      next(error);
    }
  }

  // GET /Dataset/:name/data - Get dataset data
  async getDatasetData(req, res, next) {
    try {
      const { name } = req.params;
      const { page, limit } = req.query;
      
      logger.info('Fetching dataset data', { 
        datasetName: name,
        page,
        limit
      });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dataset name is required', 'name');
      }

      const dataset = await dataService.getDatasetByName(name);

      if (!dataset) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
          message: `Dataset '${name}' not found`
        });
      }

      if (!dataset.jsonData) {
        throw new ValidationError('Dataset does not contain JSON data', 'jsonData');
      }

      try {
        // Parse JSON data from database
        const jsonData = typeof dataset.jsonData === 'string' 
          ? JSON.parse(dataset.jsonData) 
          : dataset.jsonData;
        
        if (page && limit) {
          // Return paginated data
          const pageNum = Math.max(1, parseInt(page));
          const limitNum = Math.max(1, parseInt(limit));
          const startIndex = (pageNum - 1) * limitNum;
          const endIndex = startIndex + limitNum;
          
          const paginatedData = jsonData.slice(startIndex, endIndex);
          
          const pagination = {
            page: pageNum,
            limit: limitNum,
            totalRows: jsonData.length,
            totalPages: Math.ceil(jsonData.length / limitNum),
            hasNext: endIndex < jsonData.length,
            hasPrev: pageNum > 1,
            startRow: startIndex + 1,
            endRow: Math.min(endIndex, jsonData.length)
          };
          
          res.status(200).json({
            success: true,
            data: {
              dataset: dataset,
              records: paginatedData,
              pagination: pagination
            }
          });
        } else {
          // Return all data
          res.status(200).json({
            success: true,
            data: {
              dataset: dataset,
              records: jsonData,
              recordCount: jsonData.length
            }
          });
        }
      } catch (parseError) {
        logger.error('Failed to parse JSON data', { 
          error: parseError.message,
          datasetName: name 
        });
        throw new Error(`Failed to parse dataset JSON data: ${parseError.message}`);
      }
    } catch (error) {
      logger.error('Failed to retrieve dataset data', { 
        error: error.message,
        datasetName: req.params.name 
      });
      next(error);
    }
  }

  // GET /Dataset/:name/info - Get dataset file information
  async getDatasetInfo(req, res, next) {
    try {
      const { name } = req.params;
      logger.info('Fetching dataset info', { datasetName: name });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dataset name is required', 'name');
      }

      const dataset = await dataService.getDatasetByName(name);

      if (!dataset) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
          message: `Dataset '${name}' not found`
        });
      }

      // Calculate data size for JSON data
      const jsonDataSize = dataset.jsonData ? Buffer.byteLength(dataset.jsonData, 'utf8') : 0;
      
      const info = {
        datasetName: dataset.datasetName,
        originalFileName: dataset.originalFileName,
        originalFileSize: dataset.originalFileSize,
        jsonDataSize: jsonDataSize,
        jsonDataSizeFormatted: this.formatFileSize(jsonDataSize),
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        headers: dataset.headers,
        mimeType: dataset.mimeType,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt
      };
      
      res.status(200).json({
        success: true,
        data: {
          dataset: dataset,
          fileInfo: info
        }
      });
    } catch (error) {
      logger.error('Failed to retrieve dataset info', { 
        error: error.message,
        datasetName: req.params.name 
      });
      next(error);
    }
  }

  // DELETE /Dataset/:name - Delete dataset
  async deleteDataset(req, res, next) {
    try {
      const { name } = req.params;
      logger.info('Deleting dataset', { datasetName: name });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dataset name is required', 'name');
      }

      const dataset = await dataService.getDatasetByName(name);
      if (!dataset) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
          message: `Dataset '${name}' not found`
        });
      }

      // Delete the dataset from database (JSON data is stored in database)
      const deleted = await dataService.deleteDataset(name);

      res.status(200).json({
        success: true,
        message: 'Dataset deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete dataset', { 
        error: error.message,
        datasetName: req.params.name 
      });
      next(error);
    }
  }

  // Utility method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new DatasetController();
