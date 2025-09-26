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
      <div className={`space-y-3 ${className}`}>
        <div className="relative">
          <select 
            disabled 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed focus:outline-none"
          >
            <option>{MESSAGES.LOADING}</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="relative">
          <select 
            disabled 
            className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-500 cursor-not-allowed focus:outline-none"
          >
            <option>{MESSAGES.ERROR}</option>
          </select>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <select
          value={selectedDataset?.datasetName || ''}
          onChange={(e) => {
            const datasetName = e.target.value;
            const dataset = datasets.find(d => d.datasetName === datasetName);
            onDatasetSelect(dataset || null);
          }}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white border-gray-300 hover:border-gray-400'
          } ${selectedDataset ? 'border-primary-300 bg-primary-50' : ''}`}
        >
          <option value="" className="text-gray-500">
            {datasets.length > 0 ? 'Select a dataset...' : MESSAGES.NO_DATASETS}
          </option>
          {datasets.map((dataset) => (
            <option key={dataset.datasetName} value={dataset.datasetName} className="text-gray-900">
              {dataset.datasetName}
              {dataset.fileName && ` (${dataset.fileName})`}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {datasets.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{MESSAGES.NO_DATASETS}</p>
          <p className="text-xs text-gray-600">{MESSAGES.UPLOAD_DATASET}</p>
        </div>
      )}
      
      {selectedDataset && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-900">{selectedDataset.datasetName}</p>
              {selectedDataset.fileName && (
                <p className="text-xs text-primary-700">File: {selectedDataset.fileName}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
