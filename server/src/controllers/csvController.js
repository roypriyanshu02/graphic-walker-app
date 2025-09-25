const csvService = require('../services/csvService');
const logger = require('../utils/logger');
const { validation, ValidationError } = require('../utils/validation');

class CsvController {
  // GET /api/csv/read - Read CSV data
  async readCsvData(req, res, next) {
    try {
      const { csvPath } = req.query;
      logger.info('Reading CSV data', { csvPath });

      validation.validateCsvQuery({ csvPath });

      const data = await csvService.readCsvData(csvPath);
      
      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No data found',
          message: 'No data found in the CSV file'
        });
      }

      res.status(200).json({
        success: true,
        data: data,
        recordCount: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : []
      });
    } catch (error) {
      logger.error('Failed to read CSV data', { 
        error: error.message,
        csvPath: req.query.csvPath 
      });
      next(error);
    }
  }

  // GET /api/csv/info - Get CSV file information
  async getCsvInfo(req, res, next) {
    try {
      const { csvPath } = req.query;
      logger.info('Getting CSV file info', { csvPath });

      validation.validateCsvQuery({ csvPath });

      const info = await csvService.getCsvInfo(csvPath);
      
      res.status(200).json({
        success: true,
        data: info
      });
    } catch (error) {
      logger.error('Failed to get CSV info', { 
        error: error.message,
        csvPath: req.query.csvPath 
      });
      next(error);
    }
  }

  // GET /api/csv/columns - Read specific CSV columns
  async readCsvColumns(req, res, next) {
    try {
      const { csvPath, columns } = req.query;
      logger.info('Reading CSV columns', { csvPath, columns });

      validation.validateCsvQuery({ csvPath });

      if (!columns || columns.trim() === '') {
        throw new ValidationError('Columns parameter is required (comma-separated list)', 'columns');
      }

      // Parse columns from comma-separated string
      const columnList = columns.split(',')
        .map(col => col.trim())
        .filter(col => col.length > 0);
      
      if (columnList.length === 0) {
        throw new ValidationError('At least one column must be specified', 'columns');
      }

      const data = await csvService.readCsvColumns(csvPath, columnList);
      
      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No data found',
          message: 'No data found for the specified columns'
        });
      }

      res.status(200).json({
        success: true,
        data: data,
        recordCount: data.length,
        requestedColumns: columnList
      });
    } catch (error) {
      logger.error('Failed to read CSV columns', { 
        error: error.message,
        csvPath: req.query.csvPath,
        columns: req.query.columns
      });
      next(error);
    }
  }

  // GET /api/csv/paginated - Read CSV data with pagination
  async readCsvPaginated(req, res, next) {
    try {
      const { csvPath, page = 1, limit = 100 } = req.query;
      logger.info('Reading CSV with pagination', { csvPath, page, limit });

      validation.validateCsvQuery({ csvPath, page, limit });

      const result = await csvService.readCsvPaginated(csvPath, page, limit);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        columns: result.data.length > 0 ? Object.keys(result.data[0]) : []
      });
    } catch (error) {
      logger.error('Failed to read CSV with pagination', { 
        error: error.message,
        csvPath: req.query.csvPath,
        page: req.query.page,
        limit: req.query.limit
      });
      next(error);
    }
  }

  // GET /api/csv/stats - Get CSV statistics and analysis
  async getCsvStats(req, res, next) {
    try {
      const { csvPath } = req.query;
      logger.info('Getting CSV statistics', { csvPath });

      validation.validateCsvQuery({ csvPath });

      const stats = await csvService.getCsvStats(csvPath);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get CSV statistics', { 
        error: error.message,
        csvPath: req.query.csvPath 
      });
      next(error);
    }
  }
}

module.exports = new CsvController();
