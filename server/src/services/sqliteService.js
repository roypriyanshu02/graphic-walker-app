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

      // Create user_settings table
      const createUserSettingsTable = `
        CREATE TABLE IF NOT EXISTS user_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT NOT NULL,
          setting_type TEXT DEFAULT 'string',
          is_global BOOLEAN DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, setting_key)
        )
      `;

      // Create user_groups table for shared settings
      const createUserGroupsTable = `
        CREATE TABLE IF NOT EXISTS user_groups (
          id TEXT PRIMARY KEY,
          group_name TEXT UNIQUE NOT NULL,
          description TEXT DEFAULT '',
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )
      `;

      // Create user_group_members table
      const createUserGroupMembersTable = `
        CREATE TABLE IF NOT EXISTS user_group_members (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at TEXT NOT NULL,
          FOREIGN KEY (group_id) REFERENCES user_groups (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(group_id, user_id)
        )
      `;

      // Create group_settings table
      const createGroupSettingsTable = `
        CREATE TABLE IF NOT EXISTS group_settings (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT NOT NULL,
          setting_type TEXT DEFAULT 'string',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (group_id) REFERENCES user_groups (id) ON DELETE CASCADE,
          UNIQUE(group_id, setting_key)
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
        'CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings (setting_key)',
        'CREATE INDEX IF NOT EXISTS idx_user_groups_name ON user_groups (group_name)',
        'CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members (group_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_group_settings_group_id ON group_settings (group_id)',
        'CREATE INDEX IF NOT EXISTS idx_group_settings_key ON group_settings (setting_key)'
      ];

      // Execute table creation
      this.db.run(createUsersTable);
      this.db.run(createDatasetsTable);
      this.db.run(createDashboardsTable);
      this.db.run(createUserSettingsTable);
      this.db.run(createUserGroupsTable);
      this.db.run(createUserGroupMembersTable);
      this.db.run(createGroupSettingsTable);
      
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

  // User Settings methods
  async getUserSettings(userId) {
    await this.initialize();
    logger.debug('Fetching user settings', { userId });
    
    try {
      const sql = `
        SELECT 
          id,
          setting_key as key,
          setting_value as value,
          setting_type as type,
          is_global as isGlobal,
          created_at as createdAt,
          updated_at as updatedAt
        FROM user_settings 
        WHERE user_id = ?
        ORDER BY setting_key
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([userId]);
      
      const settings = {};
      while (stmt.step()) {
        const row = stmt.getAsObject();
        // Parse value based on type
        let parsedValue = row.value;
        try {
          switch (row.type) {
            case 'boolean':
              parsedValue = row.value === 'true';
              break;
            case 'number':
              parsedValue = parseFloat(row.value);
              break;
            case 'json':
              parsedValue = JSON.parse(row.value);
              break;
            default:
              parsedValue = row.value;
          }
        } catch (e) {
          logger.warn('Failed to parse setting value', { key: row.key, value: row.value, type: row.type });
        }
        
        settings[row.key] = {
          value: parsedValue,
          type: row.type,
          isGlobal: Boolean(row.isGlobal),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      }
      
      stmt.free();
      return settings;
    } catch (error) {
      logger.error('Failed to fetch user settings', { userId, error: error.message });
      throw error;
    }
  }

  async getUserSetting(userId, settingKey) {
    await this.initialize();
    logger.debug('Fetching user setting', { userId, settingKey });
    
    try {
      const sql = `
        SELECT 
          setting_value as value,
          setting_type as type,
          is_global as isGlobal,
          created_at as createdAt,
          updated_at as updatedAt
        FROM user_settings 
        WHERE user_id = ? AND setting_key = ?
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([userId, settingKey]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        
        // Parse value based on type
        let parsedValue = row.value;
        try {
          switch (row.type) {
            case 'boolean':
              parsedValue = row.value === 'true';
              break;
            case 'number':
              parsedValue = parseFloat(row.value);
              break;
            case 'json':
              parsedValue = JSON.parse(row.value);
              break;
            default:
              parsedValue = row.value;
          }
        } catch (e) {
          logger.warn('Failed to parse setting value', { key: settingKey, value: row.value, type: row.type });
        }
        
        return {
          value: parsedValue,
          type: row.type,
          isGlobal: Boolean(row.isGlobal),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch user setting', { userId, settingKey, error: error.message });
      throw error;
    }
  }

  async saveUserSetting(userId, settingKey, settingValue, settingType = 'string', isGlobal = false) {
    await this.initialize();
    logger.info('Saving user setting', { userId, settingKey, settingType });
    
    try {
      const now = new Date().toISOString();
      
      // Convert value to string for storage
      let stringValue;
      switch (settingType) {
        case 'boolean':
          stringValue = settingValue ? 'true' : 'false';
          break;
        case 'number':
          stringValue = settingValue.toString();
          break;
        case 'json':
          stringValue = JSON.stringify(settingValue);
          break;
        default:
          stringValue = settingValue.toString();
      }
      
      // Check if setting exists
      const existingStmt = this.db.prepare('SELECT id, created_at FROM user_settings WHERE user_id = ? AND setting_key = ?');
      existingStmt.bind([userId, settingKey]);
      
      let existing = null;
      if (existingStmt.step()) {
        existing = existingStmt.getAsObject();
      }
      existingStmt.free();
      
      if (existing) {
        // Update existing setting
        const updateSql = `
          UPDATE user_settings 
          SET setting_value = ?, setting_type = ?, is_global = ?, updated_at = ?
          WHERE user_id = ? AND setting_key = ?
        `;
        
        const updateStmt = this.db.prepare(updateSql);
        updateStmt.run([
          stringValue,
          settingType,
          isGlobal ? 1 : 0,
          now,
          userId,
          settingKey
        ]);
        updateStmt.free();
        
        logger.info('User setting updated', { userId, settingKey });
      } else {
        // Insert new setting
        const insertSql = `
          INSERT INTO user_settings (id, user_id, setting_key, setting_value, setting_type, is_global, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertStmt = this.db.prepare(insertSql);
        insertStmt.run([
          uuidv4(),
          userId,
          settingKey,
          stringValue,
          settingType,
          isGlobal ? 1 : 0,
          now,
          now
        ]);
        insertStmt.free();
        
        logger.info('New user setting created', { userId, settingKey });
      }
      
      // Save database to file
      await this.saveDatabase();
      
      return {
        key: settingKey,
        value: settingValue,
        type: settingType,
        isGlobal: isGlobal,
        updatedAt: now
      };
    } catch (error) {
      logger.error('Failed to save user setting', { userId, settingKey, error: error.message });
      throw error;
    }
  }

  async saveUserSettings(userId, settings) {
    await this.initialize();
    logger.info('Saving multiple user settings', { userId, settingsCount: Object.keys(settings).length });
    
    try {
      const results = [];
      
      for (const [key, settingData] of Object.entries(settings)) {
        const { value, type = 'string', isGlobal = false } = settingData;
        const result = await this.saveUserSetting(userId, key, value, type, isGlobal);
        results.push(result);
      }
      
      logger.info('Multiple user settings saved successfully', { userId, count: results.length });
      return results;
    } catch (error) {
      logger.error('Failed to save multiple user settings', { userId, error: error.message });
      throw error;
    }
  }

  async deleteUserSetting(userId, settingKey) {
    await this.initialize();
    logger.info('Deleting user setting', { userId, settingKey });
    
    try {
      const stmt = this.db.prepare('DELETE FROM user_settings WHERE user_id = ? AND setting_key = ?');
      const result = stmt.run([userId, settingKey]);
      stmt.free();
      
      if (result.changes === 0) {
        logger.warn('User setting not found for deletion', { userId, settingKey });
        return false;
      }
      
      // Save database to file
      await this.saveDatabase();
      
      logger.info('User setting deleted successfully', { userId, settingKey });
      return true;
    } catch (error) {
      logger.error('Failed to delete user setting', { userId, settingKey, error: error.message });
      throw error;
    }
  }

  // User Groups methods
  async createUserGroup(groupData, createdBy) {
    await this.initialize();
    logger.info('Creating user group', { groupName: groupData.groupName, createdBy });
    
    try {
      const now = new Date().toISOString();
      const groupId = uuidv4();
      
      const insertSql = `
        INSERT INTO user_groups (id, group_name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const stmt = this.db.prepare(insertSql);
      stmt.run([
        groupId,
        groupData.groupName,
        groupData.description || '',
        createdBy,
        now,
        now
      ]);
      stmt.free();
      
      // Add creator as admin member
      await this.addUserToGroup(groupId, createdBy, 'admin');
      
      // Save database to file
      await this.saveDatabase();
      
      logger.info('User group created successfully', { groupName: groupData.groupName, groupId });
      
      return {
        id: groupId,
        groupName: groupData.groupName,
        description: groupData.description || '',
        createdBy: createdBy,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      logger.error('Failed to create user group', { groupName: groupData.groupName, error: error.message });
      throw error;
    }
  }

  async addUserToGroup(groupId, userId, role = 'member') {
    await this.initialize();
    logger.info('Adding user to group', { groupId, userId, role });
    
    try {
      const now = new Date().toISOString();
      
      const insertSql = `
        INSERT INTO user_group_members (id, group_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const stmt = this.db.prepare(insertSql);
      stmt.run([
        uuidv4(),
        groupId,
        userId,
        role,
        now
      ]);
      stmt.free();
      
      // Save database to file
      await this.saveDatabase();
      
      logger.info('User added to group successfully', { groupId, userId, role });
      return true;
    } catch (error) {
      logger.error('Failed to add user to group', { groupId, userId, error: error.message });
      throw error;
    }
  }

  async getUserGroups(userId) {
    await this.initialize();
    logger.debug('Fetching user groups', { userId });
    
    try {
      const sql = `
        SELECT 
          ug.id,
          ug.group_name as groupName,
          ug.description,
          ug.created_by as createdBy,
          ug.created_at as createdAt,
          ug.updated_at as updatedAt,
          ugm.role
        FROM user_groups ug
        JOIN user_group_members ugm ON ug.id = ugm.group_id
        WHERE ugm.user_id = ?
        ORDER BY ug.group_name
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([userId]);
      
      const groups = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        groups.push(row);
      }
      
      stmt.free();
      return groups;
    } catch (error) {
      logger.error('Failed to fetch user groups', { userId, error: error.message });
      throw error;
    }
  }

  async getGroupSettings(groupId) {
    await this.initialize();
    logger.debug('Fetching group settings', { groupId });
    
    try {
      const sql = `
        SELECT 
          setting_key as key,
          setting_value as value,
          setting_type as type,
          created_at as createdAt,
          updated_at as updatedAt
        FROM group_settings 
        WHERE group_id = ?
        ORDER BY setting_key
      `;
      
      const stmt = this.db.prepare(sql);
      stmt.bind([groupId]);
      
      const settings = {};
      while (stmt.step()) {
        const row = stmt.getAsObject();
        // Parse value based on type
        let parsedValue = row.value;
        try {
          switch (row.type) {
            case 'boolean':
              parsedValue = row.value === 'true';
              break;
            case 'number':
              parsedValue = parseFloat(row.value);
              break;
            case 'json':
              parsedValue = JSON.parse(row.value);
              break;
            default:
              parsedValue = row.value;
          }
        } catch (e) {
          logger.warn('Failed to parse group setting value', { key: row.key, value: row.value, type: row.type });
        }
        
        settings[row.key] = {
          value: parsedValue,
          type: row.type,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      }
      
      stmt.free();
      return settings;
    } catch (error) {
      logger.error('Failed to fetch group settings', { groupId, error: error.message });
      throw error;
    }
  }

  async saveGroupSetting(groupId, settingKey, settingValue, settingType = 'string') {
    await this.initialize();
    logger.info('Saving group setting', { groupId, settingKey, settingType });
    
    try {
      const now = new Date().toISOString();
      
      // Convert value to string for storage
      let stringValue;
      switch (settingType) {
        case 'boolean':
          stringValue = settingValue ? 'true' : 'false';
          break;
        case 'number':
          stringValue = settingValue.toString();
          break;
        case 'json':
          stringValue = JSON.stringify(settingValue);
          break;
        default:
          stringValue = settingValue.toString();
      }
      
      // Check if setting exists
      const existingStmt = this.db.prepare('SELECT id, created_at FROM group_settings WHERE group_id = ? AND setting_key = ?');
      existingStmt.bind([groupId, settingKey]);
      
      let existing = null;
      if (existingStmt.step()) {
        existing = existingStmt.getAsObject();
      }
      existingStmt.free();
      
      if (existing) {
        // Update existing setting
        const updateSql = `
          UPDATE group_settings 
          SET setting_value = ?, setting_type = ?, updated_at = ?
          WHERE group_id = ? AND setting_key = ?
        `;
        
        const updateStmt = this.db.prepare(updateSql);
        updateStmt.run([
          stringValue,
          settingType,
          now,
          groupId,
          settingKey
        ]);
        updateStmt.free();
        
        logger.info('Group setting updated', { groupId, settingKey });
      } else {
        // Insert new setting
        const insertSql = `
          INSERT INTO group_settings (id, group_id, setting_key, setting_value, setting_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertStmt = this.db.prepare(insertSql);
        insertStmt.run([
          uuidv4(),
          groupId,
          settingKey,
          stringValue,
          settingType,
          now,
          now
        ]);
        insertStmt.free();
        
        logger.info('New group setting created', { groupId, settingKey });
      }
      
      // Save database to file
      await this.saveDatabase();
      
      return {
        key: settingKey,
        value: settingValue,
        type: settingType,
        updatedAt: now
      };
    } catch (error) {
      logger.error('Failed to save group setting', { groupId, settingKey, error: error.message });
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
