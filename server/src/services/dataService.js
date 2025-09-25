const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

// SurrealDB-compatible in-memory implementation
class SurrealDBService {
  constructor() {
    this.dashboards = new Map();
    this.datasets = new Map();
    this.connected = false;
  }

  async initialize() {
    if (!this.connected) {
      await this.connect();
    }
    return this;
  }

  async connect() {
    try {
      // Initialize in-memory storage
      this.dashboards.clear();
      this.datasets.clear();
      
      this.connected = true;
      logger.info('Connected to SurrealDB-compatible in-memory database');
      
      // Migrate existing JSON data if present
      await this.migrateFromJson();
      
      return this;
    } catch (error) {
      logger.error('Failed to initialize SurrealDB service', { error: error.message });
      throw new Error(`SurrealDB service initialization failed: ${error.message}`);
    }
  }

  // Schema is implicit in the in-memory implementation
  // Data validation happens at the service level

  async migrateFromJson() {
    try {
      logger.info('Checking for JSON data to migrate...');
      
      const dashboardsPath = path.join(config.storage.dataDir, config.storage.dashboardsFile);
      const datasetsPath = path.join(config.storage.dataDir, config.storage.datasetsFile);

      // Migrate dashboards
      if (fs.existsSync(dashboardsPath)) {
        const dashboardsData = JSON.parse(fs.readFileSync(dashboardsPath, 'utf8'));
        if (dashboardsData.length > 0) {
          for (const dashboard of dashboardsData) {
            const id = uuidv4();
            this.dashboards.set(dashboard.dashboardName, {
              id,
              dashboardName: dashboard.dashboardName,
              datasetName: dashboard.datasetName,
              jsonFormat: dashboard.jsonFormat,
              isMultiple: dashboard.isMultiple || false,
              createdAt: dashboard.createdAt || new Date().toISOString(),
              updatedAt: dashboard.updatedAt || new Date().toISOString()
            });
          }
          logger.info(`Migrated ${dashboardsData.length} dashboards from JSON`);
        }
      }

      // Migrate datasets
      if (fs.existsSync(datasetsPath)) {
        const datasetsData = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
        if (datasetsData.length > 0) {
          for (const dataset of datasetsData) {
            const id = uuidv4();
            this.datasets.set(dataset.datasetName, {
              id,
              datasetName: dataset.datasetName,
              csvPath: dataset.csvPath || dataset.excelPath,
              isItFromCsv: dataset.isItFromCsv !== undefined ? dataset.isItFromCsv : true,
              fileName: dataset.fileName || '',
              fileSize: dataset.fileSize || 0,
              mimeType: dataset.mimeType || 'text/csv',
              sp: dataset.sp || '',
              createdAt: dataset.createdAt || new Date().toISOString(),
              updatedAt: dataset.updatedAt || new Date().toISOString()
            });
          }
          logger.info(`Migrated ${datasetsData.length} datasets from JSON`);
        }
      }

      logger.info('JSON data migration completed');
    } catch (error) {
      logger.warn('JSON data migration failed or no data to migrate', { error: error.message });
    }
  }

  async disconnect() {
    if (this.connected) {
      try {
        this.dashboards.clear();
        this.datasets.clear();
        this.connected = false;
        logger.info('Disconnected from SurrealDB service');
      } catch (error) {
        logger.error('Error disconnecting from SurrealDB service', { error: error.message });
      }
    }
  }

  // Dashboard methods
  async getDashboards() {
    await this.initialize();
    logger.debug('Fetching dashboards from SurrealDB-compatible storage');
    
    try {
      return Array.from(this.dashboards.values());
    } catch (error) {
      logger.error('Failed to fetch dashboards', { error: error.message });
      throw error;
    }
  }

  async getDashboardByName(dashboardName) {
    await this.initialize();
    logger.debug('Fetching dashboard by name', { dashboardName });
    
    try {
      const dashboard = this.dashboards.get(dashboardName) || null;
      
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
      const existing = this.dashboards.get(dashboard.dashboardName);
      const now = new Date().toISOString();
      
      const dashboardData = {
        id: existing?.id || uuidv4(),
        dashboardName: dashboard.dashboardName,
        datasetName: dashboard.datasetName,
        jsonFormat: dashboard.jsonFormat,
        isMultiple: dashboard.isMultiple || false,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      
      this.dashboards.set(dashboard.dashboardName, dashboardData);
      
      if (existing) {
        logger.info('Dashboard updated', { dashboardName: dashboard.dashboardName });
      } else {
        logger.info('New dashboard created', { dashboardName: dashboard.dashboardName });
      }
      
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
      const existed = this.dashboards.has(dashboardName);
      
      if (!existed) {
        logger.warn('Dashboard not found for deletion', { dashboardName });
        return false;
      }
      
      this.dashboards.delete(dashboardName);
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
    logger.debug('Fetching datasets from SurrealDB-compatible storage');
    
    try {
      return Array.from(this.datasets.values());
    } catch (error) {
      logger.error('Failed to fetch datasets', { error: error.message });
      throw error;
    }
  }

  async getDatasetByName(datasetName) {
    await this.initialize();
    logger.debug('Fetching dataset by name', { datasetName });
    
    try {
      const dataset = this.datasets.get(datasetName) || null;
      
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
      const existing = this.datasets.get(dataset.datasetName);
      const now = new Date().toISOString();
      
      const datasetData = {
        id: existing?.id || uuidv4(),
        datasetName: dataset.datasetName,
        csvPath: dataset.csvPath,
        isItFromCsv: dataset.isItFromCsv !== undefined ? dataset.isItFromCsv : true,
        fileName: dataset.fileName || '',
        fileSize: dataset.fileSize || 0,
        mimeType: dataset.mimeType || 'text/csv',
        sp: dataset.sp || '',
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      
      this.datasets.set(dataset.datasetName, datasetData);
      
      if (existing) {
        logger.info('Dataset updated', { datasetName: dataset.datasetName });
      } else {
        logger.info('New dataset created', { datasetName: dataset.datasetName });
      }
      
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
      const existed = this.datasets.has(datasetName);
      
      if (!existed) {
        logger.warn('Dataset not found for deletion', { datasetName });
        return false;
      }
      
      this.datasets.delete(datasetName);
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
      return {
        dashboardCount: this.dashboards.size,
        datasetCount: this.datasets.size,
        lastUpdated: new Date().toISOString(),
        database: 'SurrealDB (In-Memory)'
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
      
      return {
        status: 'healthy',
        message: 'SurrealDB-compatible service is healthy',
        database: 'SurrealDB (In-Memory)',
        namespace: config.database.namespace,
        database_name: config.database.database,
        connected: this.connected,
        dashboardCount: this.dashboards.size,
        datasetCount: this.datasets.size
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message,
        database: 'SurrealDB (In-Memory)',
        connected: this.connected
      };
    }
  }
}

module.exports = new SurrealDBService();
