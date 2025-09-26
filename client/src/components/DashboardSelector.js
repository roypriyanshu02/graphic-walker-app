import React from 'react';
import { useDashboards } from '../hooks/useDashboards';
import { MESSAGES } from '../constants/messages';
import { dateUtils } from '../utils/helpers';

const DashboardSelector = ({ 
  selectedDashboard, 
  onDashboardSelect, 
  disabled = false,
  className = '' 
}) => {
  const { dashboards, loading, error } = useDashboards();

  if (loading) {
    return (
      <div className={className}>
        <div className="input-notion cursor-not-allowed bg-notion-50">
          <div className="flex items-center justify-between">
            <span className="text-notion-400">{MESSAGES.LOADING}</span>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-notion-300 border-t-accent-600"></div>
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

  if (dashboards.length === 0) {
    return (
      <div className={className}>
        <div className="p-4 bg-notion-50 border border-notion-200 rounded-lg text-center">
          <div className="w-10 h-10 mx-auto mb-3 bg-notion-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-notion-700 mb-1">{MESSAGES.NO_DASHBOARDS}</p>
          <p className="text-xs text-notion-500">{MESSAGES.SAVE_DASHBOARD}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.dashboardName}
            onClick={() => onDashboardSelect(dashboard)}
            disabled={disabled}
            className={`w-full p-3 text-left rounded-lg border transition-all duration-150 ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:shadow-card hover:border-notion-300'
            } ${
              selectedDashboard?.dashboardName === dashboard.dashboardName
                ? 'border-accent-200 bg-accent-50'
                : 'border-notion-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    selectedDashboard?.dashboardName === dashboard.dashboardName
                      ? 'bg-accent-500'
                      : 'bg-notion-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`text-sm font-medium truncate ${
                        selectedDashboard?.dashboardName === dashboard.dashboardName
                          ? 'text-accent-900'
                          : 'text-notion-900'
                      }`}>
                        {dashboard.dashboardName}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        dashboard.isMultiple 
                          ? 'bg-accent-100 text-accent-700' 
                          : 'bg-notion-100 text-notion-700'
                      }`}>
                        {dashboard.isMultiple ? 'Multi' : 'Single'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs mb-1">
                      <svg className="w-3 h-3 mr-1 flex-shrink-0 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                      </svg>
                      <span className={`truncate ${
                        selectedDashboard?.dashboardName === dashboard.dashboardName
                          ? 'text-accent-700'
                          : 'text-notion-500'
                      }`}>
                        {dashboard.datasetName}
                      </span>
                    </div>
                    
                    {dashboard.updatedAt && (
                      <div className="flex items-center text-xs">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-notion-400">
                          {dateUtils.getRelativeTime(dashboard.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {selectedDashboard?.dashboardName === dashboard.dashboardName && (
                <svg className="w-4 h-4 text-accent-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default DashboardSelector;
