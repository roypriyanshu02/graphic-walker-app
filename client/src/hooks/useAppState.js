import { useState, useCallback } from 'react';
import { UI_CONSTANTS, STORAGE_KEYS } from '../constants';
import { storageUtils } from '../utils/helpers';

export const useAppState = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState(UI_CONSTANTS.TABS.DESIGN);
  
  // Selected dataset state
  const [selectedDataset, setSelectedDataset] = useState(() => {
    return storageUtils.getItem(STORAGE_KEYS.LAST_DATASET, null);
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Error state
  const [error, setError] = useState(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  // Tab management
  const switchTab = useCallback((tab) => {
    if (Object.values(UI_CONSTANTS.TABS).includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Dataset selection
  const selectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
    if (dataset) {
      storageUtils.setItem(STORAGE_KEYS.LAST_DATASET, dataset);
    } else {
      storageUtils.removeItem(STORAGE_KEYS.LAST_DATASET);
    }
  }, []);

  // Validate selected dataset against available datasets
  const validateSelectedDataset = useCallback((availableDatasets) => {
    if (!selectedDataset) {
      return;
    }
    
    if (!Array.isArray(availableDatasets)) {
      return;
    }
    
    // If there are no available datasets, clear the selected dataset
    if (availableDatasets.length === 0) {
      selectDataset(null);
      return;
    }
    
    // Check if the selected dataset still exists in the available datasets
    const datasetExists = availableDatasets.some(
      dataset => dataset.datasetName === selectedDataset.datasetName
    );
    
    if (!datasetExists) {
      // Clear the selected dataset if it no longer exists
      selectDataset(null);
    }
  }, [selectedDataset, selectDataset]);

  // Loading management
  const startLoading = useCallback((message = 'Loading...') => {
    setIsLoading(true);
    setLoadingMessage(message);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  // Error management
  const showError = useCallback((errorMessage) => {
    setError(errorMessage);
    setSuccessMessage(null);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Success message management
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setError(null);
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, UI_CONSTANTS.TOAST_DURATION);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    // Tab state
    activeTab,
    switchTab,
    
    // Dataset state
    selectedDataset,
    selectDataset,
    validateSelectedDataset,
    
    // Loading state
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    
    // Error state
    error,
    showError,
    clearError,
    
    // Success state
    successMessage,
    showSuccess,
    clearSuccess,
    
    // Utility
    clearMessages
  };
};

export const useLocalStorage = (key, defaultValue = null) => {
  const [value, setValue] = useState(() => {
    return storageUtils.getItem(key, defaultValue);
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    if (newValue === null || newValue === undefined) {
      storageUtils.removeItem(key);
    } else {
      storageUtils.setItem(key, newValue);
    }
  }, [key]);

  return [value, setStoredValue];
};

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'light');

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, [setTheme]);

  const setLightTheme = useCallback(() => {
    setTheme('light');
  }, [setTheme]);

  const setDarkTheme = useCallback(() => {
    setTheme('dark');
  }, [setTheme]);

  return {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark'
  };
};
