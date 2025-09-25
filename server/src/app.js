const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.ensureDirectories();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Request logging
    if (config.server.environment !== 'test') {
      this.app.use(requestLogger);
    }

    // CORS configuration
    this.app.use(cors(config.cors));

    // Body parsing middleware
    this.app.use(bodyParser.json({ limit: config.upload.maxSize }));
    this.app.use(bodyParser.urlencoded({ 
      extended: true, 
      limit: config.upload.maxSize 
    }));

    // Security headers
    this.app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });

    logger.info('Middleware configured successfully');
  }

  ensureDirectories() {
    const requiredDirs = [
      config.storage.dataDir,
      config.upload.uploadDir
    ];

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created directory', { path: dir });
      }
    });
  }

  setupRoutes() {
    // Mount all routes
    this.app.use('/', routes);

    // 404 handler for undefined routes
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', { 
        method: req.method, 
        url: req.originalUrl,
        ip: req.ip 
      });
      
      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /Dashboard',
          'POST /Dashboard',
          'GET /Dataset',
          'POST /Dataset/upload',
          'GET /api/csv/read'
        ]
      });
    });

    logger.info('Routes configured successfully');
  }

  setupErrorHandling() {
    // Global error handler (must be last)
    this.app.use(errorHandler);
    logger.info('Error handling configured successfully');
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();
