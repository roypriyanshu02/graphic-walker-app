const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @route GET /Dashboard
 * @desc Get all dashboards
 * @access Public
 */
router.get('/', dashboardController.getDashboards);

/**
 * @route POST /Dashboard
 * @desc Save/create a dashboard
 * @access Public
 */
router.post('/', dashboardController.saveDashboard);

/**
 * @route GET /Dashboard/stats
 * @desc Get dashboard statistics
 * @access Public
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @route GET /Dashboard/:name
 * @desc Get dashboard by name
 * @access Public
 */
router.get('/:name', dashboardController.getDashboardByName);

/**
 * @route DELETE /Dashboard/:name
 * @desc Delete dashboard by name
 * @access Public
 */
router.delete('/:name', dashboardController.deleteDashboard);

module.exports = router;
