import { api } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

class CsvService {
  // Read complete CSV data
  async readCsvData(csvPath) {
    const response = await api.get(ENDPOINTS.CSV_READ, { csvPath });
    return response.success ? response.data : [];
  }

  // Get CSV file information
  async getCsvInfo(csvPath) {
    const response = await api.get(ENDPOINTS.CSV_INFO, { csvPath });
    return response.success ? response.data : null;
  }

  // Read specific columns from CSV
  async readCsvColumns(csvPath, columns) {
    const columnsParam = Array.isArray(columns) ? columns.join(',') : columns;
    const response = await api.get(ENDPOINTS.CSV_COLUMNS, { 
      csvPath, 
      columns: columnsParam 
    });
    return response.success ? response.data : [];
  }

  // Read CSV data with pagination
  async readCsvPaginated(csvPath, page = 1, limit = 100) {
    const response = await api.get(ENDPOINTS.CSV_PAGINATED, { 
      csvPath, 
      page, 
      limit 
    });
    return response.success ? response.data : null;
  }

  // Get CSV statistics and analysis
  async getCsvStats(csvPath) {
    const response = await api.get(ENDPOINTS.CSV_STATS, { csvPath });
    return response.success ? response.data : null;
  }

  // Validate CSV file path
  validateCsvPath(csvPath) {
    const errors = [];
    
    if (!csvPath || csvPath.trim().length === 0) {
      errors.push('CSV file path is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate pagination parameters
  validatePagination(page, limit) {
    const errors = [];
    
    if (page !== null && page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('Page must be a positive integer');
      }
    }
    
    if (limit !== null && limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        errors.push('Limit must be between 1 and 1000');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get CSV data with automatic pagination for large files
  async getCsvDataSafe(csvPath, maxRecords = 1000) {
    try {
      // First, get file info to check size
      const info = await this.getCsvInfo(csvPath);
      
      if (!info) {
        throw new Error('Unable to get CSV file information');
      }
      
      // If file is small enough, read all data
      if (info.rowCount <= maxRecords) {
        return await this.readCsvData(csvPath);
      }
      
      // For large files, use pagination
      const pageSize = Math.min(maxRecords, 500);
      const result = await this.readCsvPaginated(csvPath, 1, pageSize);
      
      return result ? result.data : [];
    } catch (error) {
      console.error('Failed to get CSV data safely:', error);
      throw error;
    }
  }

  // Stream CSV data in chunks (for very large files)
  async *streamCsvData(csvPath, chunkSize = 100) {
    try {
      const info = await this.getCsvInfo(csvPath);
      if (!info) {
        throw new Error('Unable to get CSV file information');
      }
      
      const totalPages = Math.ceil(info.rowCount / chunkSize);
      
      for (let page = 1; page <= totalPages; page++) {
        const result = await this.readCsvPaginated(csvPath, page, chunkSize);
        if (result && result.data && result.data.length > 0) {
          yield {
            data: result.data,
            page: page,
            totalPages: totalPages,
            hasMore: page < totalPages,
            pagination: result.pagination
          };
        } else {
          break;
        }
      }
    } catch (error) {
      console.error('Failed to stream CSV data:', error);
      throw error;
    }
  }

  // Analyze CSV structure and suggest field types
  async analyzeCsvStructure(csvPath) {
    try {
      const stats = await this.getCsvStats(csvPath);
      if (!stats) {
        throw new Error('Unable to get CSV statistics');
      }
      
      const analysis = {
        fileInfo: {
          fileName: stats.fileName,
          fileSize: stats.fileSizeFormatted,
          rowCount: stats.rowCount,
          columnCount: stats.columnCount,
          lastModified: stats.lastModified
        },
        columns: stats.headers.map(header => ({
          name: header,
          type: stats.columnTypes?.[header]?.type || 'string',
          nullCount: stats.columnTypes?.[header]?.nullCount || 0,
          sampleValues: stats.columnTypes?.[header]?.sampleValues || []
        })),
        sampleData: stats.sampleData || []
      };
      
      return analysis;
    } catch (error) {
      console.error('Failed to analyze CSV structure:', error);
      throw error;
    }
  }
}

export default new CsvService();
