#!/usr/bin/env node

/**
 * Migration script to convert CSV-based datasets to JSON-based datasets
 * This script will:
 * 1. Check if migration is needed
 * 2. Convert existing CSV files to JSON data
 * 3. Update database schema
 * 4. Store JSON data directly in the database
 * 5. Clean up CSV files (optional)
 */

const path = require('path');
const fs = require('fs');

// Add the src directory to the require path
const srcPath = path.join(__dirname, 'src');
process.env.NODE_PATH = srcPath;
require('module').Module._initPaths();

const sqliteService = require('./src/services/sqliteService');
const logger = require('./src/utils/logger');

async function runMigration() {
  try {
    console.log('🚀 Starting CSV to JSON migration...');
    logger.info('Starting CSV to JSON migration script');

    // Initialize the SQLite service
    await sqliteService.initialize();
    
    // Run the migration
    const result = await sqliteService.migrateCsvToJson();
    
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Total datasets: ${result.totalDatasets || result.migrated || 0}`);
      console.log(`🔄 Migrated datasets: ${result.migratedCount || result.migrated || 0}`);
      
      if (result.migrated === 0) {
        console.log('ℹ️  No migration was needed - database schema is already up to date');
      } else {
        console.log('🎉 All datasets have been successfully converted from CSV to JSON format');
        console.log('📦 JSON data is now stored directly in the SQLite database');
        
        // Ask user if they want to clean up CSV files
        console.log('\n⚠️  CSV files are no longer needed and can be safely deleted.');
        console.log('💡 You can manually delete the /server/uploads/ directory if desired.');
      }
    } else {
      console.error('❌ Migration failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error.message);
    logger.error('Migration script failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    // Close database connection
    sqliteService.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted by user');
  sqliteService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Migration terminated');
  sqliteService.close();
  process.exit(0);
});

// Run the migration
runMigration();
