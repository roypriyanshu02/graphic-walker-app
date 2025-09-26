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
      <div className={className}>
        <div className="relative">
          <div className="input-notion cursor-not-allowed bg-notion-50">
            <div className="flex items-center justify-between">
              <span className="text-notion-400">{MESSAGES.LOADING}</span>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-notion-300 border-t-accent-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="input-notion border-error-200 bg-error-50 cursor-not-allowed">
          <span className="text-error-600">{MESSAGES.ERROR}</span>
        </div>
        <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-error-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className={className}>
        <div className="p-4 bg-notion-50 border border-notion-200 rounded-lg text-center">
          <div className="w-10 h-10 mx-auto mb-3 bg-notion-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
            </svg>
          </div>
          <p className="text-sm font-medium text-notion-700 mb-1">{MESSAGES.NO_DATASETS}</p>
          <p className="text-xs text-notion-500">{MESSAGES.UPLOAD_DATASET}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {datasets.map((dataset) => (
          <button
            key={dataset.datasetName}
            onClick={() => onDatasetSelect(dataset)}
            disabled={disabled}
            className={`w-full p-3 text-left rounded-lg border transition-all duration-150 ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:shadow-card hover:border-notion-300'
            } ${
              selectedDataset?.datasetName === dataset.datasetName
                ? 'border-accent-200 bg-accent-50'
                : 'border-notion-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    selectedDataset?.datasetName === dataset.datasetName
                      ? 'bg-accent-500'
                      : 'bg-notion-300'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedDataset?.datasetName === dataset.datasetName
                        ? 'text-accent-900'
                        : 'text-notion-900'
                    }`}>
                      {dataset.datasetName}
                    </p>
                    {dataset.fileName && (
                      <p className={`text-xs ${
                        selectedDataset?.datasetName === dataset.datasetName
                          ? 'text-accent-700'
                          : 'text-notion-500'
                      }`}>
                        {dataset.fileName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {selectedDataset?.datasetName === dataset.datasetName && (
                <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DatasetSelector;
