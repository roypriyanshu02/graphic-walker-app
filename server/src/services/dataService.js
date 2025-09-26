const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

// Pure JSON File Storage Service
class JsonFileStorageService {
  constructor() {
    this.dashboardsPath = path.join(config.storage.dataDir, config.storage.dashboardsFile);
    this.datasetsPath = path.join(config.storage.dataDir, config.storage.datasetsFile);
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.ensureDirectories();
      await this.ensureFiles();
      this.initialized = true;
      logger.info('JSON File Storage Service initialized');
    }
    return this;
  }

  async ensureDirectories() {
    try {
      if (!fs.existsSync(config.storage.dataDir)) {
        fs.mkdirSync(config.storage.dataDir, { recursive: true });
        logger.info('Created data directory', { path: config.storage.dataDir });
      }
    } catch (error) {
      logger.error('Failed to create data directory', { error: error.message });
      throw error;
    }
  }

  async ensureFiles() {
    try {
      // Ensure dashboards.json exists
      if (!fs.existsSync(this.dashboardsPath)) {
        fs.writeFileSync(this.dashboardsPath, JSON.stringify([], null, 2));
        logger.info('Created dashboards.json file');
      }

      // Ensure datasets.json exists
      if (!fs.existsSync(this.datasetsPath)) {
        fs.writeFileSync(this.datasetsPath, JSON.stringify([], null, 2));
        logger.info('Created datasets.json file');
      }
    } catch (error) {
      logger.error('Failed to ensure JSON files exist', { error: error.message });
      throw error;
    }
  }

  // Helper methods for file operations
  readJsonFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read JSON file', { filePath, error: error.message });
      return [];
    }
  }

  writeJsonFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      logger.error('Failed to write JSON file', { filePath, error: error.message });
      throw error;
    }
  }

  // Dashboard methods
  async getDashboards() {
    await this.initialize();
    logger.debug('Fetching dashboards from JSON file storage');
    
    try {
      return this.readJsonFile(this.dashboardsPath);
    } catch (error) {
      logger.error('Failed to fetch dashboards', { error: error.message });
      throw error;
    }
  }

  async getDashboardByName(dashboardName) {
    await this.initialize();
    logger.debug('Fetching dashboard by name', { dashboardName });
    
    try {
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const dashboard = dashboards.find(d => d.dashboardName === dashboardName) || null;
      
      if (!dashboard) {
        logger.warn('Dashboard not found', { dashboardName });
      }
      
      return dashboard;
    } catch (error) {
      logger.error('Failed to fetch dashboard by name', { dashboardName, error: error.message });
      throw error;
    }
  }

  async saveDashboard(dashboard) {
    await this.initialize();
    logger.info('Saving dashboard', { dashboardName: dashboard.dashboardName });
    
    try {
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const existingIndex = dashboards.findIndex(d => d.dashboardName === dashboard.dashboardName);
      const now = new Date().toISOString();
      
      const dashboardData = {
        id: existingIndex >= 0 ? dashboards[existingIndex].id : uuidv4(),
        dashboardName: dashboard.dashboardName,
        datasetName: dashboard.datasetName,
        jsonFormat: dashboard.jsonFormat,
        isMultiple: dashboard.isMultiple || false,
        createdAt: existingIndex >= 0 ? dashboards[existingIndex].createdAt : now,
        updatedAt: now
      };
      
      if (existingIndex >= 0) {
        dashboards[existingIndex] = dashboardData;
        logger.info('Dashboard updated', { dashboardName: dashboard.dashboardName });
      } else {
        dashboards.push(dashboardData);
        logger.info('New dashboard created', { dashboardName: dashboard.dashboardName });
      }
      
      this.writeJsonFile(this.dashboardsPath, dashboards);
      return dashboardData;
    } catch (error) {
      logger.error('Failed to save dashboard', { dashboardName: dashboard.dashboardName, error: error.message });
      throw error;
    }
  }

  async deleteDashboard(dashboardName) {
    await this.initialize();
    logger.info('Deleting dashboard', { dashboardName });
    
    try {
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const existingIndex = dashboards.findIndex(d => d.dashboardName === dashboardName);
      
      if (existingIndex === -1) {
        logger.warn('Dashboard not found for deletion', { dashboardName });
        return false;
      }
      
      dashboards.splice(existingIndex, 1);
      this.writeJsonFile(this.dashboardsPath, dashboards);
      
      logger.info('Dashboard deleted successfully', { dashboardName });
      return true;
    } catch (error) {
      logger.error('Failed to delete dashboard', { dashboardName, error: error.message });
      throw error;
    }
  }

  // Dataset methods
  async getDatasets() {
    await this.initialize();
    logger.debug('Fetching datasets from JSON file storage');
    
    try {
      return this.readJsonFile(this.datasetsPath);
    } catch (error) {
      logger.error('Failed to fetch datasets', { error: error.message });
      throw error;
    }
  }

  async getDatasetByName(datasetName) {
    await this.initialize();
    logger.debug('Fetching dataset by name', { datasetName });
    
    try {
      const datasets = this.readJsonFile(this.datasetsPath);
      const dataset = datasets.find(d => d.datasetName === datasetName) || null;
      
      if (!dataset) {
        logger.warn('Dataset not found', { datasetName });
      }
      
      return dataset;
    } catch (error) {
      logger.error('Failed to fetch dataset by name', { datasetName, error: error.message });
      throw error;
    }
  }

  async saveDataset(dataset) {
    await this.initialize();
    logger.info('Saving dataset', { datasetName: dataset.datasetName });
    
    try {
      const datasets = this.readJsonFile(this.datasetsPath);
      const existingIndex = datasets.findIndex(d => d.datasetName === dataset.datasetName);
      const now = new Date().toISOString();
      
      const datasetData = {
        id: existingIndex >= 0 ? datasets[existingIndex].id : uuidv4(),
        datasetName: dataset.datasetName,
        csvPath: dataset.csvPath,
        isItFromCsv: dataset.isItFromCsv !== undefined ? dataset.isItFromCsv : true,
        fileName: dataset.fileName || '',
        fileSize: dataset.fileSize || 0,
        mimeType: dataset.mimeType || 'text/csv',
        sp: dataset.sp || '',
        createdAt: existingIndex >= 0 ? datasets[existingIndex].createdAt : now,
        updatedAt: now
      };
      
      if (existingIndex >= 0) {
        datasets[existingIndex] = datasetData;
        logger.info('Dataset updated', { datasetName: dataset.datasetName });
      } else {
        datasets.push(datasetData);
        logger.info('New dataset created', { datasetName: dataset.datasetName });
      }
      
      this.writeJsonFile(this.datasetsPath, datasets);
      return datasetData;
    } catch (error) {
      logger.error('Failed to save dataset', { datasetName: dataset.datasetName, error: error.message });
      throw error;
    }
  }

  async deleteDataset(datasetName) {
    await this.initialize();
    logger.info('Deleting dataset', { datasetName });
    
    try {
      const datasets = this.readJsonFile(this.datasetsPath);
      const existingIndex = datasets.findIndex(d => d.datasetName === datasetName);
      
      if (existingIndex === -1) {
        logger.warn('Dataset not found for deletion', { datasetName });
        return false;
      }
      
      datasets.splice(existingIndex, 1);
      this.writeJsonFile(this.datasetsPath, datasets);
      
      logger.info('Dataset deleted successfully', { datasetName });
      return true;
    } catch (error) {
      logger.error('Failed to delete dataset', { datasetName, error: error.message });
      throw error;
    }
  }

  // Utility methods
  async getStats() {
    await this.initialize();
    logger.debug('Fetching database statistics');
    
    try {
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const datasets = this.readJsonFile(this.datasetsPath);
      
      return {
        dashboardCount: dashboards.length,
        datasetCount: datasets.length,
        lastUpdated: new Date().toISOString(),
        database: 'JSON File Storage'
      };
    } catch (error) {
      logger.error('Failed to fetch database statistics', { error: error.message });
      throw error;
    }
  }

  // Database health check
  async healthCheck() {
    try {
      await this.initialize();
      
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const datasets = this.readJsonFile(this.datasetsPath);
      
      return {
        status: 'healthy',
        message: 'JSON File Storage service is healthy',
        database: 'JSON File Storage',
        storage_path: config.storage.dataDir,
        dashboardCount: dashboards.length,
        datasetCount: datasets.length,
        files: {
          dashboards: this.dashboardsPath,
          datasets: this.datasetsPath
        }
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message,
        database: 'JSON File Storage'
      };
    }
  }
}

module.exports = new JsonFileStorageService();
