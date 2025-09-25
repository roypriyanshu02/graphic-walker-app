#!/usr/bin/env node

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

class Server {
  constructor() {
    this.app = app;
    this.port = config.server.port;
    this.host = config.server.host;
    this.server = null;
  }

  start() {
    this.server = this.app.listen(this.port, this.host, () => {
      logger.info('🚀 Graphic Walker Server started successfully', {
        port: this.port,
        host: this.host,
        environment: config.server.environment,
        version: '2.0.0'
      });

      this.logEndpoints();
    });

    this.setupGracefulShutdown();
    return this.server;
  }

  logEndpoints() {
    const baseUrl = `http://${this.host}:${this.port}`;
    
    console.log('\n📊 Graphic Walker API Server');
    console.log('═'.repeat(50));
    console.log(`🌐 Server URL: ${baseUrl}`);
    console.log(`📖 API Documentation: ${baseUrl}/`);
    console.log(`❤️  Health Check: ${baseUrl}/health`);
    console.log('\n📋 Main Endpoints:');
    console.log(`   📊 Dashboards: ${baseUrl}/Dashboard`);
    console.log(`   📁 Datasets: ${baseUrl}/Dataset`);
    console.log(`   📄 CSV API: ${baseUrl}/api/csv`);
    console.log('\n🔧 Development:');
    console.log(`   Environment: ${config.server.environment}`);
    console.log(`   Log Level: ${config.logging.level}`);
    console.log(`   Upload Dir: ${config.upload.uploadDir}`);
    console.log(`   Data Dir: ${config.storage.dataDir}`);
    console.log('═'.repeat(50));
    console.log('✅ Server ready for requests\n');
  }

  setupGracefulShutdown() {
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            logger.error('Error during server shutdown', { error: err.message });
            process.exit(1);
          }
          
          logger.info('Server closed successfully');
          process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
          logger.error('Forcing server shutdown after timeout');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { 
        error: err.message, 
        stack: err.stack 
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { 
        reason: reason,
        promise: promise 
      });
      process.exit(1);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
