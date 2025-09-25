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
    <div className={`file-upload ${className}`}>
      <div className="upload-form">
        {/* Dataset Name Input */}
        <div className="form-group">
          <label htmlFor="dataset-name">Dataset Name:</label>
          <input
            id="dataset-name"
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="Enter dataset name..."
            disabled={uploading}
            maxLength={100}
            className="dataset-name-input"
          />
        </div>

        {/* File Drop Zone */}
        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          {selectedFile ? (
            <div className="selected-file">
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{fileUtils.formatFileSize(selectedFile.size)}</div>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="remove-file-btn"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <p className="drop-text">{MESSAGES.DRAG_DROP_FILE}</p>
              <p className="file-types">Supported: CSV files (.csv)</p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">{progress}% uploaded</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="upload-actions">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || !datasetName.trim() || uploading}
            className="upload-btn primary"
          >
            {uploading ? MESSAGES.UPLOAD_PROGRESS : 'Upload Dataset'}
          </button>
          
          {(selectedFile || error) && !uploading && (
            <button
              type="button"
              onClick={handleReset}
              className="reset-btn secondary"
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
