import { useState, useEffect, useCallback } from 'react';
import settingsAPI from '../services/settingsApi';
import { useAuth } from '../contexts/AuthContext';

// Default settings with their types
const DEFAULT_SETTINGS = {
  theme: { value: 'light', type: 'string' },
  notifications: { value: true, type: 'boolean' },
  autoSave: { value: true, type: 'boolean' },
  defaultChartType: { value: 'bar', type: 'string' },
  dataRefreshInterval: { value: '5', type: 'string' },
  exportFormat: { value: 'png', type: 'string' },
  language: { value: 'en', type: 'string' },
  timezone: { value: 'UTC', type: 'string' },
  dateFormat: { value: 'YYYY-MM-DD', type: 'string' },
  numberFormat: { value: 'en-US', type: 'string' },
  dashboardLayout: { value: 'grid', type: 'string' },
  showTooltips: { value: true, type: 'boolean' },
  animationsEnabled: { value: true, type: 'boolean' },
  compactMode: { value: false, type: 'boolean' }
};

export const useSettings = () => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize settings with defaults
  const initializeSettings = useCallback(() => {
    const initialSettings = {};
    Object.entries(DEFAULT_SETTINGS).forEach(([key, config]) => {
      initialSettings[key] = config.value;
    });
    setSettings(initialSettings);
  }, []);

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      initializeSettings();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await settingsAPI.getUserSettings();
      const userSettings = response.data.settings;
      
      // Merge user settings with defaults
      const mergedSettings = {};
      Object.entries(DEFAULT_SETTINGS).forEach(([key, config]) => {
        if (userSettings[key]) {
          mergedSettings[key] = userSettings[key].value;
        } else {
          mergedSettings[key] = config.value;
        }
      });
      
      setSettings(mergedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError(error.message);
      // Fall back to defaults on error
      initializeSettings();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, initializeSettings]);

  // Save single setting
  const saveSetting = useCallback(async (key, value) => {
    if (!isAuthenticated || !user) {
      // For unauthenticated users, just update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Determine type from default settings
      const type = DEFAULT_SETTINGS[key]?.type || 'string';
      
      await settingsAPI.saveUserSetting(key, value, type);
      
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error(`Failed to save setting '${key}':`, error);
      setError(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, user]);

  // Save multiple settings
  const saveSettings = useCallback(async (settingsToSave) => {
    if (!isAuthenticated || !user) {
      // For unauthenticated users, just update local state
      setSettings(prev => ({ ...prev, ...settingsToSave }));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Format settings with proper types
      const formattedSettings = {};
      Object.entries(settingsToSave).forEach(([key, value]) => {
        const type = DEFAULT_SETTINGS[key]?.type || 'string';
        formattedSettings[key] = {
          value,
          type,
          isGlobal: false
        };
      });
      
      await settingsAPI.saveUserSettings(formattedSettings);
      
      // Update local state
      setSettings(prev => ({ ...prev, ...settingsToSave }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, user]);

  // Get setting value with default fallback
  const getSetting = useCallback((key, defaultValue = null) => {
    return settings[key] ?? DEFAULT_SETTINGS[key]?.value ?? defaultValue;
  }, [settings]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const defaultValues = {};
      Object.entries(DEFAULT_SETTINGS).forEach(([key, config]) => {
        defaultValues[key] = config.value;
      });
      
      if (isAuthenticated && user) {
        await saveSettings(defaultValues);
      } else {
        setSettings(defaultValues);
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, user, saveSettings]);

  // Load settings when authentication state changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    isSaving,
    getSetting,
    saveSetting,
    saveSettings,
    resetSettings,
    loadSettings,
    // Convenience getters for common settings
    theme: getSetting('theme'),
    notifications: getSetting('notifications'),
    autoSave: getSetting('autoSave'),
    defaultChartType: getSetting('defaultChartType'),
    dataRefreshInterval: getSetting('dataRefreshInterval'),
    exportFormat: getSetting('exportFormat')
  };
};

// Hook for user groups
export const useUserGroups = () => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await settingsAPI.getUserGroups();
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to load user groups:', error);
      setError(error.message);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const createGroup = useCallback(async (groupName, description = '') => {
    try {
      setError(null);
      
      const response = await settingsAPI.createUserGroup(groupName, description);
      
      // Reload groups to get updated list
      await loadGroups();
      
      return response.data.group;
    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.message);
      throw error;
    }
  }, [loadGroups]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    loadGroups,
    createGroup
  };
};

export default useSettings;
