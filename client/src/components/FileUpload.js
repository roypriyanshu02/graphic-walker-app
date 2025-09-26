import React, { useState, useRef } from 'react';
import { useDatasetUpload } from '../hooks/useDatasets';
import { MESSAGES } from '../constants/messages';
import { UI_CONSTANTS } from '../constants';
import { fileUtils, validationUtils } from '../utils/helpers';

const FileUpload = ({ onUploadSuccess, onUploadError, className = '' }) => {
  const [datasetName, setDatasetName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const { uploading, progress, error, uploadDataset, resetUpload } = useDatasetUpload();

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    if (!fileUtils.isValidFileType(file, UI_CONSTANTS.FILE_UPLOAD.ACCEPTED_TYPES)) {
      onUploadError?.(MESSAGES.CSV_ONLY);
      return;
    }

    if (!fileUtils.isValidFileSize(file, UI_CONSTANTS.FILE_UPLOAD.MAX_SIZE)) {
      onUploadError?.(MESSAGES.FILE_TOO_LARGE);
      return;
    }

    setSelectedFile(file);
    
    // Auto-generate dataset name from filename if not set
    if (!datasetName) {
      const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const cleanName = baseName.replace(/[^a-zA-Z0-9\s\-_]/g, ''); // Clean special chars
      setDatasetName(cleanName);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !datasetName.trim()) return;

    // Validate dataset name
    if (!validationUtils.isValidDatasetName(datasetName)) {
      onUploadError?.('Please enter a valid dataset name (letters, numbers, spaces, hyphens, and underscores only)');
      return;
    }

    try {
      const result = await uploadDataset(selectedFile, datasetName.trim());
      if (result) {
        onUploadSuccess?.(result);
        // Reset form
        setSelectedFile(null);
        setDatasetName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else if (error) {
        onUploadError?.(error);
      }
    } catch (err) {
      onUploadError?.(err.message || MESSAGES.UPLOAD_ERROR);
    }
  };

  // Reset upload state
  const handleReset = () => {
    setSelectedFile(null);
    setDatasetName('');
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        {/* Dataset Name Input */}
        <div className="space-y-2">
          <label htmlFor="dataset-name" className="block text-sm font-medium text-gray-700">
            Dataset Name
          </label>
          <input
            id="dataset-name"
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="Enter dataset name..."
            disabled={uploading}
            maxLength={100}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              uploading 
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          />
        </div>

        {/* File Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive 
              ? 'border-primary-400 bg-primary-50' 
              : selectedFile 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          } ${uploading ? 'cursor-not-allowed opacity-75' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading}
          />
          
          {selectedFile ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-600">{fileUtils.formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">{MESSAGES.DRAG_DROP_FILE}</p>
                <p className="text-sm text-gray-600">Supported: CSV files (.csv)</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Uploading...</span>
              <span className="text-primary-600 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || !datasetName.trim() || uploading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !selectedFile || !datasetName.trim() || uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft hover:shadow-medium'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{MESSAGES.UPLOAD_PROGRESS}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Dataset</span>
              </div>
            )}
          </button>
          
          {(selectedFile || error) && !uploading && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
