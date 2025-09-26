const config = require('../config');
const logger = require('../utils/logger');

// Data Service Factory - Automatically migrates from JSON to SQLite if needed
class DataService {
  constructor() {
    this.service = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      // Always use SQLite service
      const SQLiteService = require('./sqliteService');
      this.service = SQLiteService;
      
      // Check if we need to migrate from JSON
      await this.checkAndMigrateFromJson();
      
      // Initialize the SQLite service
      await this.service.initialize();
      
      this.initialized = true;
      logger.info('Data Service initialized with SQLite backend');
    }
    return this;
  }

  async checkAndMigrateFromJson() {
    try {
      const jsonMigrationService = require('./jsonMigrationService');
      const hasJsonData = await jsonMigrationService.hasData();
      
      if (hasJsonData.hasDatasets || hasJsonData.hasDashboards) {
        logger.info('JSON data found, starting migration to SQLite', {
          datasets: hasJsonData.datasetCount,
          dashboards: hasJsonData.dashboardCount
        });
        
        // Initialize SQLite service for migration
        await this.service.initialize();
        
        // Check if SQLite already has data (to avoid duplicate migration)
        const sqliteStats = await this.service.getStats();
        
        if (sqliteStats.datasetCount === 0 && sqliteStats.dashboardCount === 0) {
          // Perform migration
          const migrationResult = await this.service.migrateFromJson();
          
          if (migrationResult.success) {
            // Backup JSON files after successful migration
            await jsonMigrationService.backupJsonFiles();
            
            logger.info('Migration from JSON to SQLite completed successfully', {
              migratedDatasets: migrationResult.datasetsCount,
              migratedDashboards: migrationResult.dashboardsCount
            });
          }
        } else {
          logger.info('SQLite database already contains data, skipping migration', {
            existingDatasets: sqliteStats.datasetCount,
            existingDashboards: sqliteStats.dashboardCount
          });
        }
      } else {
        logger.info('No JSON data found, starting with fresh SQLite database');
      }
    } catch (error) {
      logger.warn('Migration check failed, continuing with SQLite', { error: error.message });
    }
  }

  // Delegate all methods to the underlying service
  async getDashboards() {
    await this.initialize();
    return this.service.getDashboards();
  }

  async getDashboardByName(dashboardName) {
    await this.initialize();
    return this.service.getDashboardByName(dashboardName);
  }

  async saveDashboard(dashboard) {
    await this.initialize();
    return this.service.saveDashboard(dashboard);
  }

  async deleteDashboard(dashboardName) {
    await this.initialize();
    return this.service.deleteDashboard(dashboardName);
  }

  async getDatasets() {
    await this.initialize();
    return this.service.getDatasets();
  }

  async getDatasetByName(datasetName) {
    await this.initialize();
    return this.service.getDatasetByName(datasetName);
  }

  async saveDataset(dataset) {
    await this.initialize();
    return this.service.saveDataset(dataset);
  }

  async deleteDataset(datasetName) {
    await this.initialize();
    return this.service.deleteDataset(datasetName);
  }

  async getStats() {
    await this.initialize();
    return this.service.getStats();
  }

  async healthCheck() {
    await this.initialize();
    return this.service.healthCheck();
  }

  // User authentication methods
  async createUser(userData) {
    await this.initialize();
    return this.service.createUser(userData);
  }

  async getUserByEmail(email) {
    await this.initialize();
    return this.service.getUserByEmail(email);
  }

  async getUserById(userId) {
    await this.initialize();
    return this.service.getUserById(userId);
  }

  async updateUserLastLogin(userId) {
    await this.initialize();
    return this.service.updateUserLastLogin(userId);
  }

  // Additional utility methods
  async migrateFromJson() {
    await this.initialize();
    if (this.service.migrateFromJson) {
      return this.service.migrateFromJson();
    }
    throw new Error('Migration not supported by current service');
  }

  close() {
    if (this.service && this.service.close) {
      this.service.close();
    }
    this.initialized = false;
  }
}

module.exports = new DataService();
