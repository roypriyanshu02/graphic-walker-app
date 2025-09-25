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
      <div className={`dashboard-selector ${className}`}>
        <select disabled>
          <option>{MESSAGES.LOADING}</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-selector ${className}`}>
        <select disabled>
          <option>{MESSAGES.ERROR}</option>
        </select>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-selector ${className}`}>
      <select
        value={selectedDashboard?.dashboardName || ''}
        onChange={(e) => {
          const dashboardName = e.target.value;
          const dashboard = dashboards.find(d => d.dashboardName === dashboardName);
          onDashboardSelect(dashboard || null);
        }}
        disabled={disabled}
        className="dashboard-select"
      >
        <option value="">
          {dashboards.length > 0 ? 'Select a dashboard...' : MESSAGES.NO_DASHBOARDS}
        </option>
        {dashboards.map((dashboard) => (
          <option key={dashboard.dashboardName} value={dashboard.dashboardName}>
            {dashboard.dashboardName}
            {dashboard.datasetName && ` (${dashboard.datasetName})`}
          </option>
        ))}
      </select>
      
      {dashboards.length === 0 && !loading && (
        <div className="no-dashboards-message">
          <p>{MESSAGES.NO_DASHBOARDS}</p>
          <p className="help-text">{MESSAGES.SAVE_DASHBOARD}</p>
        </div>
      )}

      {/* Dashboard List View */}
      {dashboards.length > 0 && (
        <div className="dashboard-list">
          {dashboards.map((dashboard) => (
            <div 
              key={dashboard.dashboardName}
              className={`dashboard-item ${selectedDashboard?.dashboardName === dashboard.dashboardName ? 'selected' : ''}`}
              onClick={() => onDashboardSelect(dashboard)}
            >
              <div className="dashboard-info">
                <h4 className="dashboard-name">{dashboard.dashboardName}</h4>
                <p className="dashboard-dataset">Dataset: {dashboard.datasetName}</p>
                {dashboard.updatedAt && (
                  <p className="dashboard-date">
                    Updated: {dateUtils.getRelativeTime(dashboard.updatedAt)}
                  </p>
                )}
              </div>
              <div className="dashboard-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDashboardSelect(dashboard);
                  }}
                  className="select-btn"
                  disabled={disabled}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSelector;
