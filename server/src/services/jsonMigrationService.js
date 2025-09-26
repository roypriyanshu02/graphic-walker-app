const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

// JSON Migration Service - Used only for migrating existing JSON data to SQLite
class JsonMigrationService {
  constructor() {
    this.dashboardsPath = path.join(config.storage.dataDir, config.storage.dashboardsFile);
    this.datasetsPath = path.join(config.storage.dataDir, config.storage.datasetsFile);
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      this.initialized = true;
      logger.info('JSON Migration Service initialized');
    }
    return this;
  }

  // Helper methods for file operations
  readJsonFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn('JSON file does not exist', { filePath });
        return [];
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read JSON file', { filePath, error: error.message });
      return [];
    }
  }

  // Dashboard methods
  async getDashboards() {
    await this.initialize();
    logger.debug('Reading dashboards from JSON file for migration');
    
    try {
      return this.readJsonFile(this.dashboardsPath);
    } catch (error) {
      logger.error('Failed to fetch dashboards for migration', { error: error.message });
      throw error;
    }
  }

  // Dataset methods
  async getDatasets() {
    await this.initialize();
    logger.debug('Reading datasets from JSON file for migration');
    
    try {
      return this.readJsonFile(this.datasetsPath);
    } catch (error) {
      logger.error('Failed to fetch datasets for migration', { error: error.message });
      throw error;
    }
  }

  // Check if JSON files exist and have data
  async hasData() {
    await this.initialize();
    
    try {
      const dashboards = this.readJsonFile(this.dashboardsPath);
      const datasets = this.readJsonFile(this.datasetsPath);
      
      return {
        hasDashboards: dashboards.length > 0,
        hasDatasets: datasets.length > 0,
        dashboardCount: dashboards.length,
        datasetCount: datasets.length
      };
    } catch (error) {
      logger.error('Failed to check JSON data', { error: error.message });
      return {
        hasDashboards: false,
        hasDatasets: false,
        dashboardCount: 0,
        datasetCount: 0
      };
    }
  }

  // Backup JSON files after successful migration
  async backupJsonFiles() {
    await this.initialize();
    logger.info('Creating backup of JSON files');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(config.storage.dataDir, 'json-backup');
      
      // Create backup directory
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Backup files if they exist
      const filesToBackup = [
        { source: this.dashboardsPath, name: 'dashboards.json' },
        { source: this.datasetsPath, name: 'datasets.json' }
      ];
      
      for (const file of filesToBackup) {
        if (fs.existsSync(file.source)) {
          const backupPath = path.join(backupDir, `${timestamp}-${file.name}`);
          fs.copyFileSync(file.source, backupPath);
          logger.info('JSON file backed up', { source: file.source, backup: backupPath });
        }
      }
      
      logger.info('JSON files backup completed', { backupDir });
      return backupDir;
    } catch (error) {
      logger.error('Failed to backup JSON files', { error: error.message });
      throw error;
    }
  }
}

module.exports = new JsonMigrationService();
