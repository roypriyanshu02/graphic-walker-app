const dataService = require('../services/dataService');
const logger = require('../utils/logger');
const { validation, ValidationError } = require('../utils/validation');

class DashboardController {
  // GET /Dashboard - Get all dashboards
  async getDashboards(req, res, next) {
    try {
      logger.info('Fetching all dashboards');
      const dashboards = await dataService.getDashboards();
      
      res.status(200).json({
        success: true,
        data: dashboards,
        count: dashboards.length
      });
    } catch (error) {
      logger.error('Failed to retrieve dashboards', { error: error.message });
      next(error);
    }
  }

  // POST /Dashboard - Save dashboard
  async saveDashboard(req, res, next) {
    try {
      const dashboard = req.body;
      logger.info('Saving dashboard', { dashboardName: dashboard?.dashboardName });

      // Validate dashboard data
      validation.validateDashboard(dashboard);

      // Additional validations
      if (dashboard.dashboardName.length > 100) {
        throw new ValidationError('Dashboard name cannot exceed 100 characters', 'dashboardName');
      }

      // Validate JSON format
      if (dashboard.jsonFormat) {
        try {
          JSON.parse(dashboard.jsonFormat);
        } catch (jsonError) {
          throw new ValidationError('Invalid JSON format provided', 'jsonFormat');
        }
      }

      // Check if referenced dataset exists
      const existingDataset = await dataService.getDatasetByName(dashboard.datasetName);
      if (!existingDataset) {
        throw new ValidationError(`Dataset '${dashboard.datasetName}' does not exist`, 'datasetName');
      }

      const savedDashboard = await dataService.saveDashboard(dashboard);
      
      res.status(200).json({
        success: true,
        message: 'Dashboard saved successfully',
        data: savedDashboard
      });
    } catch (error) {
      logger.error('Failed to save dashboard', { 
        error: error.message,
        dashboardName: req.body?.dashboardName 
      });
      next(error);
    }
  }

  // GET /Dashboard/:name - Get dashboard by name
  async getDashboardByName(req, res, next) {
    try {
      const { name } = req.params;
      logger.info('Fetching dashboard by name', { dashboardName: name });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dashboard name is required', 'name');
      }

      const dashboard = await dataService.getDashboardByName(name);

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          error: 'Dashboard not found',
          message: `Dashboard '${name}' not found`
        });
      }

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Failed to retrieve dashboard', { 
        error: error.message,
        dashboardName: req.params.name 
      });
      next(error);
    }
  }

  // DELETE /Dashboard/:name - Delete dashboard by name
  async deleteDashboard(req, res, next) {
    try {
      const { name } = req.params;
      logger.info('Deleting dashboard', { dashboardName: name });

      if (!name || name.trim() === '') {
        throw new ValidationError('Dashboard name is required', 'name');
      }

      const deleted = await dataService.deleteDashboard(name);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Dashboard not found',
          message: `Dashboard '${name}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete dashboard', { 
        error: error.message,
        dashboardName: req.params.name 
      });
      next(error);
    }
  }

  // GET /Dashboard/stats - Get dashboard statistics
  async getDashboardStats(req, res, next) {
    try {
      logger.info('Fetching dashboard statistics');
      const stats = await dataService.getStats();
      
      res.status(200).json({
        success: true,
        data: {
          dashboardCount: stats.dashboardCount,
          lastUpdated: stats.lastUpdated
        }
      });
    } catch (error) {
      logger.error('Failed to retrieve dashboard statistics', { error: error.message });
      next(error);
    }
  }
}

module.exports = new DashboardController();
