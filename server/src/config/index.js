const path = require('path');

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // CORS configuration
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
  },

  // File upload configuration
  upload: {
    maxSize: '50mb',
    allowedTypes: ['.csv'],
    uploadDir: path.join(__dirname, '../../uploads')
  },

  // Database configuration (SurrealDB)
  database: {
    url: process.env.SURREALDB_URL || `file://${path.join(__dirname, '../../database/graphic-walker.db')}`,
    namespace: process.env.SURREALDB_NAMESPACE || 'graphic_walker',
    database: process.env.SURREALDB_DATABASE || 'main',
    username: process.env.SURREALDB_USERNAME || 'root',
    password: process.env.SURREALDB_PASSWORD || 'root',
    // For embedded/file-based storage
    path: process.env.SURREALDB_PATH || path.join(__dirname, '../../database/graphic-walker.db')
  },

  // Legacy data storage configuration (for migration)
  storage: {
    dataDir: path.join(__dirname, '../../data'),
    dashboardsFile: 'dashboards.json',
    datasetsFile: 'datasets.json'
  },

  // CSV processing configuration
  csv: {
    defaultPageSize: 100,
    maxPageSize: 1000,
    encoding: 'utf8'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple'
  }
};

module.exports = config;
