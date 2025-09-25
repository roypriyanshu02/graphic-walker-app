import React from 'react';
import { useDatasets } from '../hooks/useDatasets';
import { MESSAGES } from '../constants/messages';

const DatasetSelector = ({ 
  selectedDataset, 
  onDatasetSelect, 
  disabled = false,
  className = '' 
}) => {
  const { datasets, loading, error } = useDatasets();

  if (loading) {
    return (
      <div className={`dataset-selector ${className}`}>
        <select disabled>
          <option>{MESSAGES.LOADING}</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dataset-selector ${className}`}>
        <select disabled>
          <option>{MESSAGES.ERROR}</option>
        </select>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className={`dataset-selector ${className}`}>
      <select
        value={selectedDataset?.datasetName || ''}
        onChange={(e) => {
          const datasetName = e.target.value;
          const dataset = datasets.find(d => d.datasetName === datasetName);
          onDatasetSelect(dataset || null);
        }}
        disabled={disabled}
        className="dataset-select"
      >
        <option value="">
          {datasets.length > 0 ? 'Select a dataset...' : MESSAGES.NO_DATASETS}
        </option>
        {datasets.map((dataset) => (
          <option key={dataset.datasetName} value={dataset.datasetName}>
            {dataset.datasetName}
            {dataset.fileName && ` (${dataset.fileName})`}
          </option>
        ))}
      </select>
      
      {datasets.length === 0 && !loading && (
        <div className="no-datasets-message">
          <p>{MESSAGES.NO_DATASETS}</p>
          <p className="help-text">{MESSAGES.UPLOAD_DATASET}</p>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
