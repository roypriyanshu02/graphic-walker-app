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

  // Database configuration
  database: {
    type: 'sqlite',
    path: path.join(__dirname, '../../data/graphic-walker.db'),
    options: {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
      fileMustExist: false
    }
  },

  // Legacy JSON file storage configuration (for migration)
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
