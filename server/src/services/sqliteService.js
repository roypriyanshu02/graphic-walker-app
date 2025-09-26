const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

class SQLiteService {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.initialized = false;
    this.dbPath = config.database.path;
  }

  async initialize() {
    if (!this.initialized) {
      await this.ensureDirectories();
      await this.initializeDatabase();
      await this.createTables();
      this.initialized = true;
      logger.info('SQLite Database Service initialized', { dbPath: this.dbPath });
    }
    return this;
  }

  async ensureDirectories() {
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info('Created database directory', { path: dbDir });
      }
    } catch (error) {
      logger.error('Failed to create database directory', { error: error.message });
      throw error;
    }
  }

  async initializeDatabase() {
    try {
      // Initialize sql.js
      this.SQL = await initSqlJs();
      
      // Load existing database if it exists
      if (fs.existsSync(this.dbPath)) {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(filebuffer);
        logger.info('Loaded existing SQLite database', { dbPath: this.dbPath });
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        logger.info('Created new SQLite database', { dbPath: this.dbPath });
      }
      
      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');
      
      logger.info('SQLite database connection established', { dbPath: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error: error.message });
      throw error;
    }
  }

  async createTables() {
    try {
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login_at TEXT
        )
      `;

      // Create datasets table
      const createDatasetsTable = `
        CREATE TABLE IF NOT EXISTS datasets (
          id TEXT PRIMARY KEY,
          dataset_name TEXT UNIQUE NOT NULL,
          csv_path TEXT NOT NULL,
          is_it_from_csv BOOLEAN DEFAULT 1,
          file_name TEXT DEFAULT '',
          file_size INTEGER DEFAULT 0,
          mime_type TEXT DEFAULT 'text/csv',
          sp TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `;

      // Create dashboards table
      const createDashboardsTable = `
        CREATE TABLE IF NOT EXISTS dashboards (
          id TEXT PRIMARY KEY,
          dashboard_name TEXT UNIQUE NOT NULL,
          dataset_name TEXT NOT NULL,
          json_format TEXT NOT NULL,
          is_multiple BOOLEAN DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (dataset_name) REFERENCES datasets (dataset_name) ON DELETE CASCADE
        )
      `;

      // Create indexes for better performance
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
        'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets (dataset_name)',
        'CREATE INDEX IF NOT EXISTS idx_dashboards_name ON dashboards (dashboard_name)',
        'CREATE INDEX IF NOT EXISTS idx_dashboards_dataset ON dashboards (dataset_name)',
        'CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards (created_at)'
      ];

      // Execute table creation
      this.db.run(createUsersTable);
      this.db.run(createDatasetsTable);
      this.db.run(createDashboardsTable);
      
      // Execute index creation
      createIndexes.forEach(indexSql => {
        this.db.run(indexSql);
      });

      // Save database to file
      await this.saveDatabase();
      
      logger.info('Database tables and indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database tables', { error: error.message });
      throw error;
    }
  }

  // Helper method to save database to file
  async saveDatabase() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      logger.error('Failed to save database to file', { error: error.message });
      throw error;
    }
  }

  // Dashboard methods
  async getDashboards() {
    await this.initialize();
    logger.debug('Fetching dashboards from SQLite database');
    
    try {
      const sql = `
        SELECT 
          id,
          dashboard_name as dashboardName,
          dataset_name as datasetName,
          json_format as jsonFormat,
          is_multiple as isMultiple,
          created_at as createdAt,
          updated_at as updatedAt
        FROM dashboards 
        ORDER BY updated_at DESC
      `;
      
      const stmt = this.db.prepare(sql);
      const dashboards = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        dashboards.push({
          ...row,
          isMultiple: Boolean(row.isMultiple)
        });
      }
      
      stmt.free();
      return dashboards;
    } catch (error) {
      logger.error('Failed to fetch dashboards', { error: error.message });
      throw error;
    }
  }

  async getDashboardByName(dashboardName) {
    await this.initialize();
    logger.debug('Fetching dashboard by name', { dashboardName });
    
    try {
      const sql = `
        SELECT 
          id,
          dashboard_name as dashboardName,
          dataset_name as datasetName,
          json_format as jsonFormat,
          is_multiple as isMultiple,
          created_at as createdAt,
          updated_at as updatedAt
        FROM dashboards 
        WHERE dashboard_name = ?
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([dashboardName]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          ...row,
          isMultiple: Boolean(row.isMultiple)
        };
      } else {
        stmt.free();
        logger.warn('Dashboard not found', { dashboardName });
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch dashboard by name', { dashboardName, error: error.message });
      throw error;
    }
  }

  async saveDashboard(dashboard) {
    await this.initialize();
    logger.info('Saving dashboard', { dashboardName: dashboard.dashboardName });
    
    try {
      const now = new Date().toISOString();
      
      // Check if dashboard exists
      const existingStmt = this.db.prepare('SELECT id, created_at FROM dashboards WHERE dashboard_name = ?');
      existingStmt.bind([dashboard.dashboardName]);
      
      let existing = null;
      if (existingStmt.step()) {
        existing = existingStmt.getAsObject();
      }
      existingStmt.free();
      
      const dashboardData = {
        id: existing ? existing.id : uuidv4(),
        dashboard_name: dashboard.dashboardName,
        dataset_name: dashboard.datasetName,
        json_format: dashboard.jsonFormat,
        is_multiple: dashboard.isMultiple ? 1 : 0,
        created_at: existing ? existing.created_at : now,
        updated_at: now
      };
      
      if (existing) {
        // Update existing dashboard
        const updateSql = `
          UPDATE dashboards 
          SET dataset_name = ?, json_format = ?, is_multiple = ?, updated_at = ?
          WHERE dashboard_name = ?
        `;
        
        const updateStmt = this.db.prepare(updateSql);
        updateStmt.run([
          dashboardData.dataset_name,
          dashboardData.json_format,
          dashboardData.is_multiple,
          dashboardData.updated_at,
          dashboardData.dashboard_name
        ]);
        updateStmt.free();
        
        logger.info('Dashboard updated', { dashboardName: dashboard.dashboardName });
      } else {
        // Insert new dashboard
        const insertSql = `
          INSERT INTO dashboards (id, dashboard_name, dataset_name, json_format, is_multiple, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertStmt = this.db.prepare(insertSql);
        insertStmt.run([
          dashboardData.id,
          dashboardData.dashboard_name,
          dashboardData.dataset_name,
          dashboardData.json_format,
          dashboardData.is_multiple,
          dashboardData.created_at,
          dashboardData.updated_at
        ]);
        insertStmt.free();
        
        logger.info('New dashboard created', { dashboardName: dashboard.dashboardName });
      }
      
      // Save database to file
      await this.saveDatabase();
      
      // Return the dashboard data in the expected format
      return {
        id: dashboardData.id,
        dashboardName: dashboardData.dashboard_name,
        datasetName: dashboardData.dataset_name,
        jsonFormat: dashboardData.json_format,
        isMultiple: Boolean(dashboardData.is_multiple),
        createdAt: dashboardData.created_at,
        updatedAt: dashboardData.updated_at
      };
    } catch (error) {
      logger.error('Failed to save dashboard', { dashboardName: dashboard.dashboardName, error: error.message });
      throw error;
    }
  }

  async deleteDashboard(dashboardName) {
    await this.initialize();
    logger.info('Deleting dashboard', { dashboardName });
    
    try {
      const stmt = this.db.prepare('DELETE FROM dashboards WHERE dashboard_name = ?');
      const result = stmt.run([dashboardName]);
      stmt.free();
      
      if (result.changes === 0) {
        logger.warn('Dashboard not found for deletion', { dashboardName });
        return false;
      }
      
      // Save database to file
      await this.saveDatabase();
      
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
    logger.debug('Fetching datasets from SQLite database');
    
    try {
      const sql = `
        SELECT 
          id,
          dataset_name as datasetName,
          csv_path as csvPath,
          is_it_from_csv as isItFromCsv,
          file_name as fileName,
          file_size as fileSize,
          mime_type as mimeType,
          sp,
          created_at as createdAt,
          updated_at as updatedAt
        FROM datasets 
        ORDER BY updated_at DESC
      `;
      
      const stmt = this.db.prepare(sql);
      const datasets = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        datasets.push({
          ...row,
          isItFromCsv: Boolean(row.isItFromCsv)
        });
      }
      
      stmt.free();
      return datasets;
    } catch (error) {
      logger.error('Failed to fetch datasets', { error: error.message });
      throw error;
    }
  }

  async getDatasetByName(datasetName) {
    await this.initialize();
    logger.debug('Fetching dataset by name', { datasetName });
    
    try {
      const sql = `
        SELECT 
          id,
          dataset_name as datasetName,
          csv_path as csvPath,
          is_it_from_csv as isItFromCsv,
          file_name as fileName,
          file_size as fileSize,
          mime_type as mimeType,
          sp,
          created_at as createdAt,
          updated_at as updatedAt
        FROM datasets 
        WHERE dataset_name = ?
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([datasetName]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          ...row,
          isItFromCsv: Boolean(row.isItFromCsv)
        };
      } else {
        stmt.free();
        logger.warn('Dataset not found', { datasetName });
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch dataset by name', { datasetName, error: error.message });
      throw error;
    }
  }

  async saveDataset(dataset) {
    await this.initialize();
    logger.info('Saving dataset', { datasetName: dataset.datasetName });
    
    try {
      const now = new Date().toISOString();
      
      // Check if dataset exists
      const existingStmt = this.db.prepare('SELECT id, created_at FROM datasets WHERE dataset_name = ?');
      existingStmt.bind([dataset.datasetName]);
      
      let existing = null;
      if (existingStmt.step()) {
        existing = existingStmt.getAsObject();
      }
      existingStmt.free();
      
      const datasetData = {
        id: existing ? existing.id : uuidv4(),
        dataset_name: dataset.datasetName,
        csv_path: dataset.csvPath,
        is_it_from_csv: dataset.isItFromCsv !== undefined ? (dataset.isItFromCsv ? 1 : 0) : 1,
        file_name: dataset.fileName || '',
        file_size: dataset.fileSize || 0,
        mime_type: dataset.mimeType || 'text/csv',
        sp: dataset.sp || '',
        created_at: existing ? existing.created_at : now,
        updated_at: now
      };
      
      if (existing) {
        // Update existing dataset
        const updateSql = `
          UPDATE datasets 
          SET csv_path = ?, is_it_from_csv = ?, file_name = ?, file_size = ?, mime_type = ?, sp = ?, updated_at = ?
          WHERE dataset_name = ?
        `;
        
        const updateStmt = this.db.prepare(updateSql);
        updateStmt.run([
          datasetData.csv_path,
          datasetData.is_it_from_csv,
          datasetData.file_name,
          datasetData.file_size,
          datasetData.mime_type,
          datasetData.sp,
          datasetData.updated_at,
          datasetData.dataset_name
        ]);
        updateStmt.free();
        
        logger.info('Dataset updated', { datasetName: dataset.datasetName });
      } else {
        // Insert new dataset
        const insertSql = `
          INSERT INTO datasets (id, dataset_name, csv_path, is_it_from_csv, file_name, file_size, mime_type, sp, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertStmt = this.db.prepare(insertSql);
        insertStmt.run([
          datasetData.id,
          datasetData.dataset_name,
          datasetData.csv_path,
          datasetData.is_it_from_csv,
          datasetData.file_name,
          datasetData.file_size,
          datasetData.mime_type,
          datasetData.sp,
          datasetData.created_at,
          datasetData.updated_at
        ]);
        insertStmt.free();
        
        logger.info('New dataset created', { datasetName: dataset.datasetName });
      }
      
      // Save database to file
      await this.saveDatabase();
      
      // Return the dataset data in the expected format
      return {
        id: datasetData.id,
        datasetName: datasetData.dataset_name,
        csvPath: datasetData.csv_path,
        isItFromCsv: Boolean(datasetData.is_it_from_csv),
        fileName: datasetData.file_name,
        fileSize: datasetData.file_size,
        mimeType: datasetData.mime_type,
        sp: datasetData.sp,
        createdAt: datasetData.created_at,
        updatedAt: datasetData.updated_at
      };
    } catch (error) {
      logger.error('Failed to save dataset', { datasetName: dataset.datasetName, error: error.message });
      throw error;
    }
  }

  async deleteDataset(datasetName) {
    await this.initialize();
    logger.info('Deleting dataset', { datasetName });
    
    try {
      // Delete related dashboards first (due to foreign key constraint)
      const deleteDashboardsStmt = this.db.prepare('DELETE FROM dashboards WHERE dataset_name = ?');
      const dashboardResult = deleteDashboardsStmt.run([datasetName]);
      deleteDashboardsStmt.free();
      
      // Delete the dataset
      const deleteDatasetStmt = this.db.prepare('DELETE FROM datasets WHERE dataset_name = ?');
      const datasetResult = deleteDatasetStmt.run([datasetName]);
      deleteDatasetStmt.free();
      
      if (datasetResult.changes === 0) {
        logger.warn('Dataset not found for deletion', { datasetName });
        return false;
      }
      
      // Save database to file
      await this.saveDatabase();
      
      logger.info('Dataset and related dashboards deleted successfully', { 
        datasetName, 
        dashboardsDeleted: dashboardResult.changes 
      });
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
      const dashboardStmt = this.db.prepare('SELECT COUNT(*) as count FROM dashboards');
      dashboardStmt.step();
      const dashboardCount = dashboardStmt.getAsObject().count;
      dashboardStmt.free();
      
      const datasetStmt = this.db.prepare('SELECT COUNT(*) as count FROM datasets');
      datasetStmt.step();
      const datasetCount = datasetStmt.getAsObject().count;
      datasetStmt.free();
      
      return {
        dashboardCount,
        datasetCount,
        lastUpdated: new Date().toISOString(),
        database: 'SQLite',
        databasePath: this.dbPath
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
      
      // Test database connectivity
      const testStmt = this.db.prepare('SELECT 1 as test');
      testStmt.step();
      testStmt.free();
      
      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        message: 'SQLite Database service is healthy',
        database: 'SQLite',
        databasePath: this.dbPath,
        dashboardCount: stats.dashboardCount,
        datasetCount: stats.datasetCount
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message,
        database: 'SQLite'
      };
    }
  }

  // Migration method to import data from JSON files
  async migrateFromJson() {
    await this.initialize();
    logger.info('Starting migration from JSON files to SQLite');
    
    try {
      const jsonService = require('./jsonMigrationService');
      await jsonService.initialize();
      
      // Migrate datasets
      const datasets = await jsonService.getDatasets();
      logger.info(`Migrating ${datasets.length} datasets`);
      
      for (const dataset of datasets) {
        await this.saveDataset(dataset);
      }
      
      // Migrate dashboards
      const dashboards = await jsonService.getDashboards();
      logger.info(`Migrating ${dashboards.length} dashboards`);
      
      for (const dashboard of dashboards) {
        await this.saveDashboard(dashboard);
      }
      
      logger.info('Migration from JSON files completed successfully', {
        datasetsCount: datasets.length,
        dashboardsCount: dashboards.length
      });
      
      return {
        success: true,
        datasetsCount: datasets.length,
        dashboardsCount: dashboards.length
      };
    } catch (error) {
      logger.error('Migration from JSON files failed', { error: error.message });
      throw error;
    }
  }

  // User authentication methods
  async createUser(userData) {
    await this.initialize();
    logger.info('Creating new user', { email: userData.email });
    
    try {
      const now = new Date().toISOString();
      const userId = uuidv4();
      
      const insertSql = `
        INSERT INTO users (id, email, password_hash, name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const stmt = this.db.prepare(insertSql);
      stmt.run([
        userId,
        userData.email,
        userData.passwordHash,
        userData.name,
        1,
        now,
        now
      ]);
      stmt.free();
      
      // Save database to file
      await this.saveDatabase();
      
      logger.info('User created successfully', { email: userData.email, userId });
      
      return {
        id: userId,
        email: userData.email,
        name: userData.name,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      logger.error('Failed to create user', { email: userData.email, error: error.message });
      throw error;
    }
  }

  async getUserByEmail(email) {
    await this.initialize();
    logger.debug('Fetching user by email', { email });
    
    try {
      const sql = `
        SELECT 
          id,
          email,
          password_hash as passwordHash,
          name,
          is_active as isActive,
          created_at as createdAt,
          updated_at as updatedAt,
          last_login_at as lastLoginAt
        FROM users 
        WHERE email = ? AND is_active = 1
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([email]);
      
      if (stmt.step()) {
        const user = stmt.getAsObject();
        stmt.free();
        return {
          ...user,
          isActive: Boolean(user.isActive)
        };
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch user by email', { email, error: error.message });
      throw error;
    }
  }

  async updateUserLastLogin(userId) {
    await this.initialize();
    logger.debug('Updating user last login', { userId });
    
    try {
      const now = new Date().toISOString();
      
      const updateSql = `
        UPDATE users 
        SET last_login_at = ?, updated_at = ?
        WHERE id = ?
      `;
      
      const stmt = this.db.prepare(updateSql);
      stmt.run([now, now, userId]);
      stmt.free();
      
      // Save database to file
      await this.saveDatabase();
      
      logger.debug('User last login updated', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to update user last login', { userId, error: error.message });
      throw error;
    }
  }

  async getUserById(userId) {
    await this.initialize();
    logger.debug('Fetching user by ID', { userId });
    
    try {
      const sql = `
        SELECT 
          id,
          email,
          name,
          is_active as isActive,
          created_at as createdAt,
          updated_at as updatedAt,
          last_login_at as lastLoginAt
        FROM users 
        WHERE id = ? AND is_active = 1
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([userId]);
      
      if (stmt.step()) {
        const user = stmt.getAsObject();
        stmt.free();
        return {
          ...user,
          isActive: Boolean(user.isActive)
        };
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch user by ID', { userId, error: error.message });
      throw error;
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      logger.info('SQLite database connection closed');
    }
  }
}

module.exports = new SQLiteService();
