import { api } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

class DashboardService {
  // Get all dashboards
  async getDashboards() {
    const response = await api.get(ENDPOINTS.DASHBOARDS);
    return response.success ? response.data : [];
  }

  // Get dashboard by name
  async getDashboardByName(name) {
    const response = await api.get(ENDPOINTS.DASHBOARD_BY_NAME(name));
    return response.success ? response.data : null;
  }

  // Save/create dashboard
  async saveDashboard(dashboard) {
    const response = await api.post(ENDPOINTS.DASHBOARDS, dashboard);
    return response.success ? response.data : null;
  }

  // Delete dashboard
  async deleteDashboard(name) {
    const response = await api.delete(ENDPOINTS.DASHBOARD_BY_NAME(name));
    return response.success;
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const response = await api.get(ENDPOINTS.DASHBOARD_STATS);
    return response.success ? response.data : null;
  }

  // Check if dashboard exists
  async dashboardExists(name) {
    try {
      const dashboard = await this.getDashboardByName(name);
      return dashboard !== null;
    } catch (error) {
      if (error.message.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  // Validate dashboard before saving
  validateDashboard(dashboard) {
    const errors = [];
    
    // Validate dashboard name
    if (!dashboard.dashboardName || dashboard.dashboardName.trim().length === 0) {
      errors.push('Dashboard name is required');
    } else if (dashboard.dashboardName.length > 100) {
      errors.push('Dashboard name cannot exceed 100 characters');
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(dashboard.dashboardName)) {
      errors.push('Dashboard name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
    
    // Validate dataset name
    if (!dashboard.datasetName || dashboard.datasetName.trim().length === 0) {
      errors.push('Dataset name is required');
    }
    
    // Validate JSON format
    if (dashboard.jsonFormat) {
      try {
        JSON.parse(dashboard.jsonFormat);
      } catch (jsonError) {
        errors.push('Invalid JSON format provided');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create dashboard from GraphicWalker config
  createDashboardFromConfig(dashboardName, datasetName, config, isMultiple = false) {
    return {
      dashboardName: dashboardName.trim(),
      datasetName: datasetName.trim(),
      jsonFormat: JSON.stringify(config),
      isMultiple: isMultiple,
      createdAt: new Date().toISOString()
    };
  }

  // Parse dashboard JSON format
  parseDashboardConfig(dashboard) {
    try {
      if (dashboard.jsonFormat) {
        return JSON.parse(dashboard.jsonFormat);
      }
      return null;
    } catch (error) {
      console.error('Failed to parse dashboard config:', error);
      return null;
    }
  }

  // Get recent dashboards from localStorage
  getRecentDashboards(limit = 5) {
    try {
      const recent = localStorage.getItem('gw_recent_dashboards');
      if (recent) {
        const dashboards = JSON.parse(recent);
        return dashboards.slice(0, limit);
      }
    } catch (error) {
      console.error('Failed to get recent dashboards:', error);
    }
    return [];
  }

  // Add dashboard to recent list
  addToRecentDashboards(dashboard) {
    try {
      const recent = this.getRecentDashboards(10);
      
      // Remove if already exists
      const filtered = recent.filter(d => d.dashboardName !== dashboard.dashboardName);
      
      // Add to beginning
      filtered.unshift({
        dashboardName: dashboard.dashboardName,
        datasetName: dashboard.datasetName,
        lastAccessed: new Date().toISOString()
      });
      
      // Keep only top 10
      const updated = filtered.slice(0, 10);
      
      localStorage.setItem('gw_recent_dashboards', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to add to recent dashboards:', error);
    }
  }

  // Clear recent dashboards
  clearRecentDashboards() {
    try {
      localStorage.removeItem('gw_recent_dashboards');
    } catch (error) {
      console.error('Failed to clear recent dashboards:', error);
    }
  }
}

export default new DashboardService();
