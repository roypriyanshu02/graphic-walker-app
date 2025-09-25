import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { UI_CONSTANTS, APP_CONFIG } from '../constants';
import { MESSAGES } from '../constants/messages';

// Components
import DatasetSelector from './DatasetSelector';
import DashboardSelector from './DashboardSelector';
import FileUpload from './FileUpload';
import GraphicWalkerChart, { MultipleChartsRenderer } from './GraphicWalkerChart';

// Styles
import '../styles/App.css';

const App = () => {
  const {
    activeTab,
    switchTab,
    selectedDataset,
    selectDataset,
    isLoading,
    loadingMessage,
    error,
    successMessage,
    showError,
    showSuccess,
    clearMessages
  } = useAppState();

  const [selectedDashboard, setSelectedDashboard] = React.useState(null);

  // Handle dataset selection
  const handleDatasetSelect = (dataset) => {
    selectDataset(dataset);
    clearMessages();
  };

  // Handle dashboard selection
  const handleDashboardSelect = (dashboard) => {
    setSelectedDashboard(dashboard);
    clearMessages();
  };

  // Handle file upload success
  const handleUploadSuccess = (result) => {
    showSuccess(MESSAGES.UPLOAD_SUCCESS);
    // Auto-select the uploaded dataset
    if (result.dataset) {
      selectDataset(result.dataset);
    }
  };

  // Handle file upload error
  const handleUploadError = (errorMessage) => {
    showError(errorMessage);
  };

  // Handle dashboard save
  const handleDashboardSave = (dashboard) => {
    showSuccess(MESSAGES.DASHBOARD_SAVED);
    setSelectedDashboard(dashboard);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">{APP_CONFIG.NAME}</h1>
          <p className="app-description">{APP_CONFIG.DESCRIPTION}</p>
        </div>
      </header>

      {/* Global Messages */}
      {error && (
        <div className="message error-message">
          <span>{error}</span>
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}
      
      {successMessage && (
        <div className="message success-message">
          <span>{successMessage}</span>
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === UI_CONSTANTS.TABS.DESIGN ? 'active' : ''}`}
            onClick={() => switchTab(UI_CONSTANTS.TABS.DESIGN)}
          >
            📊 Design Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === UI_CONSTANTS.TABS.VIEW ? 'active' : ''}`}
            onClick={() => switchTab(UI_CONSTANTS.TABS.VIEW)}
          >
            👁️ View Dashboard
          </button>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === UI_CONSTANTS.TABS.DESIGN && (
            <div className="design-tab">
              <div className="control-panel">
                <div className="control-section">
                  <h3>Dataset Selection</h3>
                  <DatasetSelector
                    selectedDataset={selectedDataset}
                    onDatasetSelect={handleDatasetSelect}
                    className="dataset-selector-main"
                  />
                </div>

                <div className="control-section">
                  <h3>Upload New Dataset</h3>
                  <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    className="file-upload-main"
                  />
                </div>
              </div>

              <div className="chart-container">
                <GraphicWalkerChart
                  dataset={selectedDataset}
                  mode="design"
                  onSave={handleDashboardSave}
                  className="main-chart"
                />
              </div>
            </div>
          )}

          {activeTab === UI_CONSTANTS.TABS.VIEW && (
            <div className="view-tab">
              <div className="control-panel">
                <div className="control-section">
                  <h3>Dashboard Selection</h3>
                  <DashboardSelector
                    selectedDashboard={selectedDashboard}
                    onDashboardSelect={handleDashboardSelect}
                    className="dashboard-selector-main"
                  />
                </div>
              </div>

              <div className="chart-container">
                {selectedDashboard ? (
                  <div className="dashboard-view">
                    <div className="dashboard-header">
                      <h2>{selectedDashboard.dashboardName}</h2>
                      <p className="dashboard-info">
                        Dataset: {selectedDashboard.datasetName}
                      </p>
                    </div>
                    
                    {selectedDashboard.isMultiple ? (
                      <MultipleChartsRenderer
                        dataset={{ datasetName: selectedDashboard.datasetName }}
                        dashboardConfig={JSON.parse(selectedDashboard.jsonFormat)}
                        className="dashboard-charts"
                      />
                    ) : (
                      <GraphicWalkerChart
                        dataset={{ datasetName: selectedDashboard.datasetName }}
                        dashboard={selectedDashboard}
                        mode="view"
                        className="dashboard-chart"
                      />
                    )}
                  </div>
                ) : (
                  <div className="no-dashboard-selected">
                    <h3>No Dashboard Selected</h3>
                    <p>{MESSAGES.NO_DASHBOARDS}</p>
                    <p className="help-text">
                      Create a dashboard in the Design tab, then come back here to view it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>{APP_CONFIG.NAME} v{APP_CONFIG.VERSION}</p>
          <p>Powered by Graphic Walker</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
