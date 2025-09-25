const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

class CsvService {
  constructor() {
    this.uploadsDir = config.upload.uploadDir;
    this.ensureUploadsDir();
  }

  // Ensure uploads directory exists
  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      logger.info('Created uploads directory', { path: this.uploadsDir });
    }
  }

  // Validate CSV file exists
  validateCsvFile(csvPath) {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file does not exist: ${csvPath}`);
    }

    const stats = fs.statSync(csvPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${csvPath}`);
    }

    return stats;
  }

  // Read CSV file and return data as JSON
  async readCsvData(csvPath) {
    return new Promise((resolve, reject) => {
      try {
        this.validateCsvFile(csvPath);
        
        const results = [];
        logger.debug('Starting CSV read', { csvPath });
        
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (data) => {
            // Convert empty strings to null and handle data types
            const cleanedData = {};
            Object.keys(data).forEach(key => {
              const value = data[key];
              if (value === '' || value === undefined) {
                cleanedData[key] = null;
              } else {
                // Try to convert to number if it looks like a number
                const numValue = Number(value);
                cleanedData[key] = !isNaN(numValue) && value.trim() !== '' ? numValue : value;
              }
            });
            results.push(cleanedData);
          })
          .on('end', () => {
            logger.info('CSV read completed', { 
              csvPath, 
              recordCount: results.length,
              columns: results.length > 0 ? Object.keys(results[0]).length : 0
            });
            resolve(results);
          })
          .on('error', (error) => {
            logger.error('CSV read failed', { csvPath, error: error.message });
            reject(new Error(`Failed to read CSV file: ${error.message}`));
          });
      } catch (error) {
        logger.error('CSV validation failed', { csvPath, error: error.message });
        reject(error);
      }
    });
  }

  // Get CSV file info
  async getCsvInfo(csvPath) {
    return new Promise((resolve, reject) => {
      try {
        const stats = this.validateCsvFile(csvPath);
        
        let headers = [];
        let rowCount = 0;
        let isFirstRow = true;
        
        logger.debug('Getting CSV info', { csvPath });

        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('headers', (headerList) => {
            headers = headerList;
          })
          .on('data', (data) => {
            if (isFirstRow) {
              headers = Object.keys(data);
              isFirstRow = false;
            }
            rowCount++;
          })
          .on('end', () => {
            const info = {
              fileName: path.basename(csvPath),
              filePath: csvPath,
              fileSize: stats.size,
              fileSizeFormatted: this.formatFileSize(stats.size),
              rowCount: rowCount,
              columnCount: headers.length,
              headers: headers,
              lastModified: stats.mtime,
              encoding: config.csv.encoding
            };
            
            logger.info('CSV info retrieved', { 
              csvPath, 
              rowCount: info.rowCount, 
              columnCount: info.columnCount 
            });
            
            resolve(info);
          })
          .on('error', (error) => {
            logger.error('Failed to get CSV info', { csvPath, error: error.message });
            reject(new Error(`Failed to get CSV file info: ${error.message}`));
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Read CSV file with specific columns
  async readCsvColumns(csvPath, columns) {
    return new Promise((resolve, reject) => {
      try {
        this.validateCsvFile(csvPath);

        if (!Array.isArray(columns) || columns.length === 0) {
          reject(new Error('Columns parameter must be a non-empty array'));
          return;
        }

        const results = [];
        logger.debug('Reading CSV columns', { csvPath, columns });
        
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (data) => {
            const filteredData = {};
            columns.forEach(column => {
              if (data.hasOwnProperty(column)) {
                const value = data[column];
                if (value === '' || value === undefined) {
                  filteredData[column] = null;
                } else {
                  const numValue = Number(value);
                  filteredData[column] = !isNaN(numValue) && value.trim() !== '' ? numValue : value;
                }
              }
            });
            results.push(filteredData);
          })
          .on('end', () => {
            logger.info('CSV columns read completed', { 
              csvPath, 
              columns: columns.length,
              recordCount: results.length 
            });
            resolve(results);
          })
          .on('error', (error) => {
            logger.error('Failed to read CSV columns', { csvPath, error: error.message });
            reject(new Error(`Failed to read CSV columns: ${error.message}`));
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Read CSV file with pagination
  async readCsvPaginated(csvPath, page = 1, limit = config.csv.defaultPageSize) {
    return new Promise((resolve, reject) => {
      try {
        this.validateCsvFile(csvPath);

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(config.csv.maxPageSize, Math.max(1, parseInt(limit)));

        const results = [];
        let currentRow = 0;
        const startRow = (pageNum - 1) * limitNum;
        const endRow = startRow + limitNum;
        
        logger.debug('Reading CSV with pagination', { 
          csvPath, 
          page: pageNum, 
          limit: limitNum,
          startRow,
          endRow
        });
        
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (data) => {
            if (currentRow >= startRow && currentRow < endRow) {
              const cleanedData = {};
              Object.keys(data).forEach(key => {
                const value = data[key];
                if (value === '' || value === undefined) {
                  cleanedData[key] = null;
                } else {
                  const numValue = Number(value);
                  cleanedData[key] = !isNaN(numValue) && value.trim() !== '' ? numValue : value;
                }
              });
              results.push(cleanedData);
            }
            currentRow++;
          })
          .on('end', () => {
            const paginationInfo = {
              page: pageNum,
              limit: limitNum,
              totalRows: currentRow,
              totalPages: Math.ceil(currentRow / limitNum),
              hasNext: currentRow > endRow,
              hasPrev: pageNum > 1,
              startRow: startRow + 1,
              endRow: Math.min(endRow, currentRow)
            };

            logger.info('CSV pagination completed', { 
              csvPath, 
              ...paginationInfo,
              returnedRows: results.length
            });

            resolve({
              data: results,
              pagination: paginationInfo
            });
          })
          .on('error', (error) => {
            logger.error('Failed to read CSV with pagination', { csvPath, error: error.message });
            reject(new Error(`Failed to read CSV file: ${error.message}`));
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Utility method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get CSV processing statistics
  async getCsvStats(csvPath) {
    try {
      const info = await this.getCsvInfo(csvPath);
      const sampleData = await this.readCsvPaginated(csvPath, 1, 5);
      
      // Analyze data types
      const columnTypes = {};
      if (sampleData.data.length > 0) {
        Object.keys(sampleData.data[0]).forEach(column => {
          const values = sampleData.data.map(row => row[column]).filter(v => v !== null);
          const numericValues = values.filter(v => typeof v === 'number');
          columnTypes[column] = {
            type: numericValues.length > values.length / 2 ? 'number' : 'string',
            nullCount: sampleData.data.filter(row => row[column] === null).length,
            sampleValues: values.slice(0, 3)
          };
        });
      }

      return {
        ...info,
        columnTypes,
        sampleData: sampleData.data
      };
    } catch (error) {
      logger.error('Failed to get CSV stats', { csvPath, error: error.message });
      throw error;
    }
  }
}

module.exports = new CsvService();
