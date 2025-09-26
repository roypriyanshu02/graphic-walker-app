const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const datasetRoutes = require('./datasetRoutes');
const csvRoutes = require('./csvRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Graphic Walker API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Graphic Walker API',
    version: '2.0.0',
    documentation: {
      authentication: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'Login user',
        'GET /auth/profile': 'Get user profile (requires token)',
        'GET /auth/verify': 'Verify token validity',
        'POST /auth/logout': 'Logout user'
      },
      dashboards: {
        'GET /Dashboard': 'Get all dashboards',
        'POST /Dashboard': 'Save/create dashboard',
        'GET /Dashboard/stats': 'Get dashboard statistics',
        'GET /Dashboard/:name': 'Get dashboard by name',
        'DELETE /Dashboard/:name': 'Delete dashboard by name'
      },
      datasets: {
        'GET /Dataset': 'Get all datasets',
        'POST /Dataset': 'Save/create dataset',
        'POST /Dataset/upload': 'Upload dataset file',
        'GET /Dataset/:name': 'Get dataset by name',
        'GET /Dataset/:name/data': 'Get dataset data (supports pagination)',
        'GET /Dataset/:name/info': 'Get dataset file information',
        'DELETE /Dataset/:name': 'Delete dataset by name'
      },
      csv: {
        'GET /api/csv/read': 'Read complete CSV data',
        'GET /api/csv/info': 'Get CSV file metadata',
        'GET /api/csv/columns': 'Read specific CSV columns',
        'GET /api/csv/paginated': 'Read CSV data with pagination',
        'GET /api/csv/stats': 'Get CSV statistics and analysis'
      },
      utility: {
        'GET /health': 'Health check',
        'GET /': 'API documentation'
      }
    },
    examples: {
      uploadDataset: 'POST /Dataset/upload with multipart/form-data',
      paginateData: 'GET /Dataset/:name/data?page=1&limit=50',
      readCsvColumns: 'GET /api/csv/columns?csvPath=/path/to/file.csv&columns=Name,Age,Department'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/Dashboard', dashboardRoutes);
router.use('/Dataset', datasetRoutes);
router.use('/api/csv', csvRoutes);

module.exports = router;
