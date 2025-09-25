import { useState, useEffect, useCallback } from 'react';
import datasetService from '../services/datasetService';
import { errorUtils } from '../utils/helpers';

export const useDatasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all datasets
  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await datasetService.getDatasets();
      setDatasets(data);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDatasets.loadDatasets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load datasets on mount
  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // Refresh datasets
  const refreshDatasets = useCallback(() => {
    return loadDatasets();
  }, [loadDatasets]);

  // Add new dataset to state
  const addDataset = useCallback((newDataset) => {
    setDatasets(prev => [...prev, newDataset]);
  }, []);

  // Update dataset in state
  const updateDataset = useCallback((updatedDataset) => {
    setDatasets(prev => 
      prev.map(dataset => 
        dataset.datasetName === updatedDataset.datasetName 
          ? updatedDataset 
          : dataset
      )
    );
  }, []);

  // Remove dataset from state
  const removeDataset = useCallback((datasetName) => {
    setDatasets(prev => 
      prev.filter(dataset => dataset.datasetName !== datasetName)
    );
  }, []);

  // Get dataset by name
  const getDatasetByName = useCallback((name) => {
    return datasets.find(dataset => dataset.datasetName === name);
  }, [datasets]);

  return {
    datasets,
    loading,
    error,
    refreshDatasets,
    addDataset,
    updateDataset,
    removeDataset,
    getDatasetByName
  };
};

export const useDataset = (datasetName) => {
  const [dataset, setDataset] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dataset details
  const loadDataset = useCallback(async () => {
    if (!datasetName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const datasetInfo = await datasetService.getDatasetByName(datasetName);
      setDataset(datasetInfo);
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDataset.loadDataset');
    } finally {
      setLoading(false);
    }
  }, [datasetName]);

  // Load dataset data
  const loadData = useCallback(async (page = null, limit = null) => {
    if (!datasetName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const datasetData = await datasetService.getDatasetData(datasetName, page, limit);
      setData(datasetData);
      return datasetData;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDataset.loadData');
      return null;
    } finally {
      setLoading(false);
    }
  }, [datasetName]);

  // Load dataset on mount or when name changes
  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return {
    dataset,
    data,
    loading,
    error,
    loadData,
    refreshDataset: loadDataset
  };
};

export const useDatasetUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadDataset = useCallback(async (file, datasetName) => {
    // Validate input
    const validation = datasetService.validateDataset(file, datasetName);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await datasetService.uploadDataset(
        file, 
        datasetName, 
        (progressPercent) => {
          setProgress(progressPercent);
        }
      );
      
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = errorUtils.getErrorMessage(err);
      setError(errorMessage);
      errorUtils.logError(err, 'useDatasetUpload.uploadDataset');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadDataset,
    resetUpload
  };
};
