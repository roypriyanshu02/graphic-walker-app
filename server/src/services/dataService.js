const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class DataService {
  constructor() {
    this.dataDir = config.storage.dataDir;
    this.dashboardsFile = path.join(this.dataDir, config.storage.dashboardsFile);
    this.datasetsFile = path.join(this.dataDir, config.storage.datasetsFile);
  }

  // Ensure data directory exists
  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      logger.info('Creating data directory', { path: this.dataDir });
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  // Generic method to read JSON file
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.debug('JSON file not found, returning empty array', { filePath });
        return [];
      }
      logger.error('Failed to read JSON file', { filePath, error: error.message });
      throw error;
    }
  }

  // Generic method to write JSON file
  async writeJsonFile(filePath, data) {
    try {
      await this.ensureDataDir();
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      logger.debug('JSON file written successfully', { filePath, recordCount: data.length });
    } catch (error) {
      logger.error('Failed to write JSON file', { filePath, error: error.message });
      throw error;
    }
  }

  // Dashboard methods
  async getDashboards() {
    logger.debug('Fetching dashboards');
    return await this.readJsonFile(this.dashboardsFile);
  }

  async getDashboardByName(dashboardName) {
    const dashboards = await this.getDashboards();
    const dashboard = dashboards.find(d => d.dashboardName === dashboardName);
    
    if (!dashboard) {
      logger.warn('Dashboard not found', { dashboardName });
    }
    
    return dashboard;
  }

  async saveDashboard(dashboard) {
    logger.info('Saving dashboard', { dashboardName: dashboard.dashboardName });
    
    const dashboards = await this.getDashboards();
    
    // Add ID and timestamp if not present
    if (!dashboard.id) {
      dashboard.id = uuidv4();
    }
    
    const now = new Date().toISOString();
    dashboard.updatedAt = now;

    // Check if dashboard with same name exists
    const existingIndex = dashboards.findIndex(d => d.dashboardName === dashboard.dashboardName);
    
    if (existingIndex !== -1) {
      // Update existing dashboard
      dashboard.createdAt = dashboards[existingIndex].createdAt;
      dashboards[existingIndex] = dashboard;
      logger.info('Dashboard updated', { dashboardName: dashboard.dashboardName });
    } else {
      // Add new dashboard
      dashboard.createdAt = now;
      dashboards.push(dashboard);
      logger.info('New dashboard created', { dashboardName: dashboard.dashboardName });
    }

    await this.writeJsonFile(this.dashboardsFile, dashboards);
    return dashboard;
  }

  async deleteDashboard(dashboardName) {
    logger.info('Deleting dashboard', { dashboardName });
    
    const dashboards = await this.getDashboards();
    const filteredDashboards = dashboards.filter(d => d.dashboardName !== dashboardName);
    
    if (filteredDashboards.length === dashboards.length) {
      logger.warn('Dashboard not found for deletion', { dashboardName });
      return false;
    }
    
    await this.writeJsonFile(this.dashboardsFile, filteredDashboards);
    logger.info('Dashboard deleted successfully', { dashboardName });
    return true;
  }

  // Dataset methods
  async getDatasets() {
    logger.debug('Fetching datasets');
    return await this.readJsonFile(this.datasetsFile);
  }

  async getDatasetByName(datasetName) {
    const datasets = await this.getDatasets();
    const dataset = datasets.find(d => d.datasetName === datasetName);
    
    if (!dataset) {
      logger.warn('Dataset not found', { datasetName });
    }
    
    return dataset;
  }

  async saveDataset(dataset) {
    logger.info('Saving dataset', { datasetName: dataset.datasetName });
    
    const datasets = await this.getDatasets();
    
    // Add ID and timestamp if not present
    if (!dataset.id) {
      dataset.id = uuidv4();
    }
    
    const now = new Date().toISOString();
    dataset.updatedAt = now;

    // Check if dataset with same name exists
    const existingIndex = datasets.findIndex(d => d.datasetName === dataset.datasetName);
    
    if (existingIndex !== -1) {
      // Update existing dataset
      dataset.createdAt = datasets[existingIndex].createdAt;
      datasets[existingIndex] = dataset;
      logger.info('Dataset updated', { datasetName: dataset.datasetName });
    } else {
      // Add new dataset
      dataset.createdAt = now;
      datasets.push(dataset);
      logger.info('New dataset created', { datasetName: dataset.datasetName });
    }

    await this.writeJsonFile(this.datasetsFile, datasets);
    return dataset;
  }

  async deleteDataset(datasetName) {
    logger.info('Deleting dataset', { datasetName });
    
    const datasets = await this.getDatasets();
    const filteredDatasets = datasets.filter(d => d.datasetName !== datasetName);
    
    if (filteredDatasets.length === datasets.length) {
      logger.warn('Dataset not found for deletion', { datasetName });
      return false;
    }
    
    await this.writeJsonFile(this.datasetsFile, filteredDatasets);
    logger.info('Dataset deleted successfully', { datasetName });
    return true;
  }

  // Utility methods
  async getStats() {
    const [dashboards, datasets] = await Promise.all([
      this.getDashboards(),
      this.getDatasets()
    ]);

    return {
      dashboardCount: dashboards.length,
      datasetCount: datasets.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new DataService();
