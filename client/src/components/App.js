import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { UI_CONSTANTS, APP_CONFIG } from '../constants';
import { MESSAGES } from '../constants/messages';

// Components
import DatasetSelector from './DatasetSelector';
import DashboardSelector from './DashboardSelector';
import FileUpload from './FileUpload';
import GraphicWalkerChart, { MultipleChartsRenderer } from './GraphicWalkerChart';

// Styles are now handled by Tailwind CSS

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 text-white shadow-large">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{APP_CONFIG.NAME}</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">{APP_CONFIG.DESCRIPTION}</p>
        </div>
      </header>

      {/* Global Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-6 rounded-r-lg shadow-soft animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
            <button 
              onClick={clearMessages} 
              className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-6 rounded-r-lg shadow-soft animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
            <button 
              onClick={clearMessages} 
              className="text-green-400 hover:text-green-600 transition-colors duration-200 p-1 rounded-full hover:bg-green-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-large max-w-sm mx-4 text-center animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === UI_CONSTANTS.TABS.DESIGN
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => switchTab(UI_CONSTANTS.TABS.DESIGN)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Design Dashboard</span>
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === UI_CONSTANTS.TABS.VIEW
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => switchTab(UI_CONSTANTS.TABS.VIEW)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Dashboard</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === UI_CONSTANTS.TABS.DESIGN && (
            <div className="flex-1 flex flex-col">
              {/* Control Panel */}
              <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                          </svg>
                          Dataset Selection
                        </h3>
                        <DatasetSelector
                          selectedDataset={selectedDataset}
                          onDatasetSelect={handleDatasetSelect}
                          className="dataset-selector-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload New Dataset
                        </h3>
                        <FileUpload
                          onUploadSuccess={handleUploadSuccess}
                          onUploadError={handleUploadError}
                          className="file-upload-main"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Container */}
              <div className="flex-1 bg-white">
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
            <div className="flex-1 flex flex-col">
              {/* Control Panel */}
              <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Dashboard Selection
                    </h3>
                    <DashboardSelector
                      selectedDashboard={selectedDashboard}
                      onDashboardSelect={handleDashboardSelect}
                      className="dashboard-selector-main"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 bg-gray-50">
                {selectedDashboard ? (
                  <div className="h-full">
                    {/* Dashboard Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-6">
                      <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedDashboard.dashboardName}</h2>
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                              </svg>
                              Dataset: {selectedDashboard.datasetName}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedDashboard.isMultiple 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedDashboard.isMultiple ? 'Multi-Chart' : 'Single Chart'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dashboard Charts */}
                    <div className="flex-1 bg-white">
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
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-6">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dashboard Selected</h3>
                      <p className="text-gray-600 mb-4">{MESSAGES.NO_DASHBOARDS}</p>
                      <p className="text-sm text-gray-500">
                        Create a dashboard in the Design tab, then come back here to view it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{APP_CONFIG.NAME}</span> v{APP_CONFIG.VERSION}
            </div>
            <div className="text-sm text-gray-500">
              Powered by <span className="font-medium text-primary-600">Graphic Walker</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
