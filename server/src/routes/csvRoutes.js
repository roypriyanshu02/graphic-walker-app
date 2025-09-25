const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');

/**
 * @route GET /api/csv/read
 * @desc Read complete CSV data
 * @query csvPath - Path to the CSV file
 * @access Public
 */
router.get('/read', csvController.readCsvData);

/**
 * @route GET /api/csv/info
 * @desc Get CSV file metadata and information
 * @query csvPath - Path to the CSV file
 * @access Public
 */
router.get('/info', csvController.getCsvInfo);

/**
 * @route GET /api/csv/columns
 * @desc Read specific columns from CSV file
 * @query csvPath - Path to the CSV file
 * @query columns - Comma-separated list of column names
 * @access Public
 */
router.get('/columns', csvController.readCsvColumns);

/**
 * @route GET /api/csv/paginated
 * @desc Read CSV data with pagination
 * @query csvPath - Path to the CSV file
 * @query page - Page number (default: 1)
 * @query limit - Records per page (default: 100, max: 1000)
 * @access Public
 */
router.get('/paginated', csvController.readCsvPaginated);

/**
 * @route GET /api/csv/stats
 * @desc Get CSV statistics and data analysis
 * @query csvPath - Path to the CSV file
 * @access Public
 */
router.get('/stats', csvController.getCsvStats);

module.exports = router;
