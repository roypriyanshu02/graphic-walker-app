import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import { errorUtils } from '../utils/helpers';

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all dashboards
  const loadDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dashboardService.getDashboards();
      setDashboards(data);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDashboards.loadDashboards');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dashboards on mount
  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  // Refresh dashboards
  const refreshDashboards = useCallback(() => {
    return loadDashboards();
  }, [loadDashboards]);

  // Add new dashboard to state
  const addDashboard = useCallback((newDashboard) => {
    setDashboards(prev => [...prev, newDashboard]);
  }, []);

  // Update dashboard in state
  const updateDashboard = useCallback((updatedDashboard) => {
    setDashboards(prev => 
      prev.map(dashboard => 
        dashboard.dashboardName === updatedDashboard.dashboardName 
          ? updatedDashboard 
          : dashboard
      )
    );
  }, []);

  // Remove dashboard from state
  const removeDashboard = useCallback((dashboardName) => {
    setDashboards(prev => 
      prev.filter(dashboard => dashboard.dashboardName !== dashboardName)
    );
  }, []);

  // Get dashboard by name
  const getDashboardByName = useCallback((name) => {
    return dashboards.find(dashboard => dashboard.dashboardName === name);
  }, [dashboards]);

  return {
    dashboards,
    loading,
    error,
    refreshDashboards,
    addDashboard,
    updateDashboard,
    removeDashboard,
    getDashboardByName
  };
};

export const useDashboard = (dashboardName) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dashboard details
  const loadDashboard = useCallback(async () => {
    if (!dashboardName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dashboardData = await dashboardService.getDashboardByName(dashboardName);
      setDashboard(dashboardData);
      
      // Add to recent dashboards
      if (dashboardData) {
        dashboardService.addToRecentDashboards(dashboardData);
      }
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDashboard.loadDashboard');
    } finally {
      setLoading(false);
    }
  }, [dashboardName]);

  // Load dashboard on mount or when name changes
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    refreshDashboard: loadDashboard
  };
};

export const useDashboardSave = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveDashboard = useCallback(async (dashboardData) => {
    // Validate input
    const validation = dashboardService.validateDashboard(dashboardData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await dashboardService.saveDashboard(dashboardData);
      
      // Add to recent dashboards
      if (result) {
        dashboardService.addToRecentDashboards(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDashboardSave.saveDashboard');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const resetSave = useCallback(() => {
    setSaving(false);
    setError(null);
  }, []);

  return {
    saving,
    error,
    saveDashboard,
    resetSave
  };
};

export const useRecentDashboards = () => {
  const [recentDashboards, setRecentDashboards] = useState([]);

  // Load recent dashboards
  const loadRecentDashboards = useCallback(() => {
    const recent = dashboardService.getRecentDashboards();
    setRecentDashboards(recent);
  }, []);

  // Load on mount
  useEffect(() => {
    loadRecentDashboards();
  }, [loadRecentDashboards]);

  // Clear recent dashboards
  const clearRecent = useCallback(() => {
    dashboardService.clearRecentDashboards();
    setRecentDashboards([]);
  }, []);

  return {
    recentDashboards,
    refreshRecent: loadRecentDashboards,
    clearRecent
  };
};
