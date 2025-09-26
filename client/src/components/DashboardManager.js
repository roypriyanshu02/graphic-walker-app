import React, { useState } from 'react';
import { useDashboards } from '../hooks/useDashboards';
import dashboardService from '../services/dashboardService';
import { dateUtils } from '../utils/helpers';

const DashboardManager = ({ 
  selectedDashboard, 
  onDashboardSelect,
  onDashboardDeleted,
  className = '' 
}) => {
  const { dashboards, loading, error, refreshDashboards } = useDashboards();
  const [deletingDashboard, setDeletingDashboard] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteDashboard = async (dashboardName) => {
    setDeletingDashboard(dashboardName);
    try {
      const success = await dashboardService.deleteDashboard(dashboardName);
      if (success) {
        // If the deleted dashboard was selected, clear selection
        if (selectedDashboard?.dashboardName === dashboardName) {
          onDashboardSelect(null);
        }
        // Refresh the dashboard list
        await refreshDashboards();
        if (onDashboardDeleted) {
          onDashboardDeleted(dashboardName);
        }
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    } finally {
      setDeletingDashboard(null);
      setShowDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-notion-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-notion-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="heading-notion text-base mb-2">No dashboards found</h3>
          <p className="text-notion-secondary text-sm">Create your first dashboard in the Design tab</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-3">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.dashboardName}
            className={`p-4 rounded-lg border transition-all duration-150 ${
              selectedDashboard?.dashboardName === dashboard.dashboardName
                ? 'border-accent-200 bg-accent-50'
                : 'border-notion-200 bg-white hover:border-notion-300 hover:shadow-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onDashboardSelect(dashboard)}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    selectedDashboard?.dashboardName === dashboard.dashboardName
                      ? 'bg-accent-500'
                      : 'bg-notion-300'
                  }`} />
                  <h4 className={`font-medium ${
                    selectedDashboard?.dashboardName === dashboard.dashboardName
                      ? 'text-accent-900'
                      : 'text-notion-900'
                  }`}>
                    {dashboard.dashboardName}
                  </h4>
                  <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    dashboard.isMultiple 
                      ? 'bg-accent-100 text-accent-700' 
                      : 'bg-notion-100 text-notion-700'
                  }`}>
                    {dashboard.isMultiple ? 'Multi' : 'Single'}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-notion-500 space-x-4">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                    </svg>
                    {dashboard.datasetName}
                  </div>
                  {dashboard.updatedAt && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {dateUtils.getRelativeTime(dashboard.updatedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {selectedDashboard?.dashboardName === dashboard.dashboardName && (
                  <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(dashboard.dashboardName);
                  }}
                  disabled={deletingDashboard === dashboard.dashboardName}
                  className="p-1 text-notion-400 hover:text-error-600 transition-colors duration-150 disabled:opacity-50"
                  title="Delete dashboard"
                >
                  {deletingDashboard === dashboard.dashboardName ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-notion-300 border-t-error-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-elevated max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="heading-notion text-base mb-1">Delete Dashboard</h3>
                  <p className="text-notion-secondary text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-notion-700 mb-6">
                Are you sure you want to delete the dashboard <strong>"{showDeleteConfirm}"</strong>?
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deletingDashboard}
                  className="btn-notion-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDashboard(showDeleteConfirm)}
                  disabled={deletingDashboard}
                  className="btn-notion bg-error-600 hover:bg-error-700 focus:ring-error-500"
                >
                  {deletingDashboard ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Dashboard'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardManager;
