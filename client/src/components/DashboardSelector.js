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
      <div className={`space-y-4 ${className}`}>
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
      <div className={`space-y-4 ${className}`}>
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
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <select
          value={selectedDashboard?.dashboardName || ''}
          onChange={(e) => {
            const dashboardName = e.target.value;
            const dashboard = dashboards.find(d => d.dashboardName === dashboardName);
            onDashboardSelect(dashboard || null);
          }}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white border-gray-300 hover:border-gray-400'
          } ${selectedDashboard ? 'border-primary-300 bg-primary-50' : ''}`}
        >
          <option value="" className="text-gray-500">
            {dashboards.length > 0 ? 'Select a dashboard...' : MESSAGES.NO_DASHBOARDS}
          </option>
          {dashboards.map((dashboard) => (
            <option key={dashboard.dashboardName} value={dashboard.dashboardName} className="text-gray-900">
              {dashboard.dashboardName}
              {dashboard.datasetName && ` (${dashboard.datasetName})`}
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
      
      {dashboards.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2">{MESSAGES.NO_DASHBOARDS}</p>
          <p className="text-xs text-gray-600">{MESSAGES.SAVE_DASHBOARD}</p>
        </div>
      )}

      {/* Dashboard List View */}
      {dashboards.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {dashboards.map((dashboard) => (
            <div 
              key={dashboard.dashboardName}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                selectedDashboard?.dashboardName === dashboard.dashboardName 
                  ? 'border-primary-300 bg-primary-50 shadow-soft' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => onDashboardSelect(dashboard)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{dashboard.dashboardName}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      dashboard.isMultiple 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {dashboard.isMultiple ? 'Multi' : 'Single'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                    </svg>
                    <span className="truncate">Dataset: {dashboard.datasetName}</span>
                  </div>
                  
                  {dashboard.updatedAt && (
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Updated: {dateUtils.getRelativeTime(dashboard.updatedAt)}</span>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDashboardSelect(dashboard);
                    }}
                    disabled={disabled}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                      selectedDashboard?.dashboardName === dashboard.dashboardName
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedDashboard?.dashboardName === dashboard.dashboardName ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSelector;
