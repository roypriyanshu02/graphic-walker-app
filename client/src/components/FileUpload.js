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
    <div className={`space-y-4 ${className}`}>
      {/* Dataset Name Input */}
      <div>
        <label htmlFor="dataset-name" className="block text-sm font-medium text-notion-700 mb-1.5">
          Dataset name
        </label>
        <input
          id="dataset-name"
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          placeholder="Enter dataset name..."
          disabled={uploading}
          maxLength={100}
          className={`input-notion ${uploading ? 'cursor-not-allowed bg-notion-50' : ''}`}
        />
      </div>

      {/* File Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${
          dragActive 
            ? 'border-accent-300 bg-accent-50' 
            : selectedFile 
              ? 'border-success-300 bg-success-50' 
              : 'border-notion-300 bg-notion-50 hover:border-notion-400 hover:bg-notion-100'
        } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
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
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-success-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-notion-900">{selectedFile.name}</p>
                <p className="text-xs text-notion-500">{fileUtils.formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="w-6 h-6 bg-error-100 hover:bg-error-200 text-error-600 rounded-md flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-notion-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-notion-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-notion-700 mb-1">{MESSAGES.DRAG_DROP_FILE}</p>
              <p className="text-xs text-notion-500">CSV files only</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-notion-700">Uploading...</span>
            <span className="text-accent-600 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-notion-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-accent-500 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-error-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !datasetName.trim() || uploading}
          className={`flex-1 btn-notion py-2 text-sm font-medium ${
            !selectedFile || !datasetName.trim() || uploading
              ? 'opacity-50 cursor-not-allowed'
              : 'btn-notion-primary'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              <span>{MESSAGES.UPLOAD_PROGRESS}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </div>
          )}
        </button>
        
        {(selectedFile || error) && !uploading && (
          <button
            type="button"
            onClick={handleReset}
            className="btn-notion btn-notion-ghost py-2 text-sm font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
