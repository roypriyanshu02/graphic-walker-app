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

      if (dataset.csvPath && dataset.csvPath.length > 500) {
        throw new ValidationError('CSV path cannot exceed 500 characters', 'csvPath');
      }

      // If CSV path is provided, validate file exists
      if (dataset.csvPath && dataset.isItFromCsv) {
        if (!fs.existsSync(dataset.csvPath)) {
          throw new ValidationError('CSV file does not exist at the specified path', 'csvPath');
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

      // Create dataset entry
      const dataset = {
        datasetName: datasetName.trim(),
        csvPath: file.path,
        isItFromCsv: true,
        sp: '',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      };

      const savedDataset = await dataService.saveDataset(dataset);

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          dataset: savedDataset,
          filePath: file.path,
          fileName: file.originalname,
          fileSize: file.size
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

      if (!dataset.isItFromCsv || !dataset.csvPath) {
        throw new ValidationError('Dataset is not configured for CSV data or CSV path is missing', 'csvPath');
      }

      try {
        let result;
        
        if (page && limit) {
          // Return paginated data
          result = await csvService.readCsvPaginated(dataset.csvPath, page, limit);
          res.status(200).json({
            success: true,
            data: {
              dataset: dataset,
              records: result.data,
              pagination: result.pagination
            }
          });
        } else {
          // Return all data
          const data = await csvService.readCsvData(dataset.csvPath);
          res.status(200).json({
            success: true,
            data: {
              dataset: dataset,
              records: data,
              recordCount: data.length
            }
          });
        }
      } catch (csvError) {
        logger.error('Failed to read CSV data', { 
          error: csvError.message,
          csvPath: dataset.csvPath 
        });
        throw new Error(`Failed to read CSV data: ${csvError.message}`);
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

      if (!dataset.isItFromCsv || !dataset.csvPath) {
        throw new ValidationError('Dataset is not configured for CSV data', 'csvPath');
      }

      const info = await csvService.getCsvInfo(dataset.csvPath);
      
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

      // Delete the CSV file if it exists
      if (dataset.csvPath && fs.existsSync(dataset.csvPath)) {
        fs.unlinkSync(dataset.csvPath);
        logger.info('Deleted CSV file', { csvPath: dataset.csvPath });
      }

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
}

module.exports = new DatasetController();
