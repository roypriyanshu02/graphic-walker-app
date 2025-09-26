import React, { useState } from 'react';

const DashboardCreateDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  datasetName = '',
  isLoading = false 
}) => {
  const [dashboardName, setDashboardName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate dashboard name
    if (!dashboardName.trim()) {
      setError('Dashboard name is required');
      return;
    }
    
    if (dashboardName.length > 100) {
      setError('Dashboard name cannot exceed 100 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(dashboardName)) {
      setError('Dashboard name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }
    
    setError('');
    onSave(dashboardName.trim());
  };

  const handleClose = () => {
    setDashboardName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-elevated max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-notion-200">
          <div className="flex items-center justify-between">
            <h2 className="heading-notion text-lg">Save Dashboard</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-notion-400 hover:text-notion-600 transition-colors duration-150 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Dataset Info */}
            <div className="p-3 bg-notion-50 rounded-lg border border-notion-200">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-notion-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                </svg>
                <span className="text-notion-600">Dataset: </span>
                <span className="font-medium text-notion-900 ml-1">{datasetName}</span>
              </div>
            </div>

            {/* Dashboard Name Input */}
            <div>
              <label htmlFor="dashboardName" className="block text-sm font-medium text-notion-700 mb-2">
                Dashboard Name
              </label>
              <input
                type="text"
                id="dashboardName"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                disabled={isLoading}
                className="input-notion w-full"
                placeholder="Enter dashboard name..."
                maxLength={100}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-error-600">{error}</p>
              )}
              <p className="mt-1 text-xs text-notion-500">
                {dashboardName.length}/100 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-notion-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-notion-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !dashboardName.trim()}
              className="btn-notion flex items-center"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              )}
              Save Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardCreateDialog;
