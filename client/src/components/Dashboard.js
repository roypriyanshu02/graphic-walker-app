import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useDatasets } from '../hooks/useDatasets';
import { UI_CONSTANTS, APP_CONFIG } from '../constants';
import { MESSAGES } from '../constants/messages';

// Components
import DatasetSelector from './DatasetSelector';
import DashboardSelector from './DashboardSelector';
import DashboardManager from './DashboardManager';
import FileUpload from './FileUpload';
import GraphicWalkerChart, { MultipleChartsRenderer } from './GraphicWalkerChart';
import GettingStarted from './GettingStarted';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    activeTab,
    switchTab,
    selectedDataset,
    selectDataset,
    validateSelectedDataset,
    isLoading,
    loadingMessage,
    error,
    successMessage,
    showError,
    showSuccess,
    clearMessages
  } = useAppState();

  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  
  // Get datasets for validation
  const { datasets, loading: datasetsLoading } = useDatasets();

  // Set active tab based on current route
  useEffect(() => {
    if (location.pathname === '/dashboard/design') {
      switchTab(UI_CONSTANTS.TABS.DESIGN);
    } else {
      switchTab(UI_CONSTANTS.TABS.VIEW);
    }
  }, [location.pathname, switchTab]);

  // Validate selected dataset when datasets are loaded (only when not loading)
  useEffect(() => {
    if (!datasetsLoading) {
      validateSelectedDataset(datasets);
    }
  }, [datasets, datasetsLoading, validateSelectedDataset]);

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

  // Handle dashboard deleted
  const handleDashboardDeleted = (dashboardName) => {
    showSuccess(`Dashboard "${dashboardName}" deleted successfully`);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle navigation
  const handleNavigation = (path) => {
    setShowProfileMenu(false);
    navigate(path);
  };

  return (
    <div className="page-notion flex h-screen">
      {/* Sidebar */}
      <div className="sidebar-notion w-64 flex-shrink-0 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-notion-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-notion-900 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-notion-900">{APP_CONFIG.NAME}</h1>
              <p className="text-xs text-notion-600">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                activeTab === UI_CONSTANTS.TABS.VIEW
                  ? 'bg-accent-100 text-accent-900 font-medium'
                  : 'text-notion-700 hover:bg-notion-100'
              }`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Dashboard
            </button>
            
            <button
              onClick={() => navigate('/dashboard/design')}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                activeTab === UI_CONSTANTS.TABS.DESIGN
                  ? 'bg-accent-100 text-accent-900 font-medium'
                  : 'text-notion-700 hover:bg-notion-100'
              }`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Design
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center px-3 py-2 text-sm text-notion-700 hover:bg-notion-100 rounded-md transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </nav>

        {/* User Menu */}
        <div className="p-3 border-t border-notion-200">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center px-3 py-2 text-sm text-notion-700 hover:bg-notion-100 rounded-md transition-colors duration-150"
            >
              <div className="w-6 h-6 bg-notion-300 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-notion-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-notion-500">{user?.email}</p>
              </div>
              <svg className={`w-4 h-4 transition-transform duration-150 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-elevated border border-notion-200 py-1 z-50 animate-slide-up">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Messages */}
        {error && (
          <div className="mx-6 mt-4">
            <div className="bg-error-50 border border-error-200 rounded-lg p-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-error-800 font-medium">{error}</p>
                </div>
                <button 
                  onClick={clearMessages} 
                  className="text-error-400 hover:text-error-600 transition-colors duration-150"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mx-6 mt-4">
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-success-800 font-medium">{successMessage}</p>
                </div>
                <button 
                  onClick={clearMessages} 
                  className="text-success-400 hover:text-success-600 transition-colors duration-150"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-elevated max-w-sm mx-4 text-center animate-scale-in">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-notion-200 border-t-accent-600 mx-auto mb-3"></div>
              <p className="text-sm text-notion-700 font-medium">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === UI_CONSTANTS.TABS.VIEW && (
            <div className="p-6">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="heading-notion text-xl mb-2">Dashboard</h1>
                <p className="text-notion-secondary text-sm">View and interact with your saved dashboards</p>
              </div>

              {/* Dashboard Management */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="heading-notion text-base">Your Dashboards</h2>
                  <button
                    onClick={() => setShowGettingStarted(true)}
                    className="text-xs text-notion-500 hover:text-accent-600 transition-colors duration-150 flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </button>
                </div>
                <DashboardManager
                  selectedDashboard={selectedDashboard}
                  onDashboardSelect={handleDashboardSelect}
                  onDashboardDeleted={handleDashboardDeleted}
                  className="dashboard-manager-main"
                />
              </div>

              {/* Dashboard Content */}
              {selectedDashboard ? (
                <div className="card-notion">
                  {/* Dashboard Header */}
                  <div className="p-4 border-b border-notion-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="heading-notion text-lg mb-1">{selectedDashboard.dashboardName}</h3>
                        <div className="flex items-center text-sm text-notion-secondary">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0 0l-3-3m3 3V8" />
                          </svg>
                          {selectedDashboard.datasetName}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          selectedDashboard.isMultiple 
                            ? 'bg-accent-100 text-accent-800' 
                            : 'bg-notion-100 text-notion-800'
                        }`}>
                          {selectedDashboard.isMultiple ? 'Multi-Chart' : 'Single Chart'}
                        </span>
                        <button
                          onClick={() => {
                            // Select the dataset and navigate to design mode
                            const dataset = datasets.find(d => d.datasetName === selectedDashboard.datasetName);
                            if (dataset) {
                              selectDataset(dataset);
                              navigate('/dashboard/design');
                            }
                          }}
                          className="text-xs text-notion-500 hover:text-accent-600 transition-colors duration-150 flex items-center px-2 py-1 rounded hover:bg-notion-50"
                          title="Edit this dashboard"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Charts */}
                  <div className="p-4">
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
                <div className="flex items-center justify-center py-16">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-notion-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="heading-notion text-base mb-2">No dashboard selected</h3>
                    <p className="text-notion-secondary text-sm mb-4">{MESSAGES.NO_DASHBOARDS}</p>
                    <p className="text-notion-muted text-xs">
                      Create a dashboard in the Design tab, then come back here to view it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === UI_CONSTANTS.TABS.DESIGN && (
            <div className="p-6">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="heading-notion text-xl mb-2">Design</h1>
                <p className="text-notion-secondary text-sm">Create and customize your data visualizations</p>
              </div>

              {/* Control Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card-notion p-4">
                  <h2 className="heading-notion text-base mb-4">Dataset</h2>
                  <DatasetSelector
                    key={selectedDataset?.datasetName || 'no-dataset'}
                    selectedDataset={selectedDataset}
                    onDatasetSelect={handleDatasetSelect}
                    className="dataset-selector-main"
                  />
                </div>

                <div className="card-notion p-4">
                  <h2 className="heading-notion text-base mb-4">Upload Data</h2>
                  <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    className="file-upload-main"
                  />
                </div>
              </div>

              {/* Chart Container */}
              {selectedDataset ? (
                <div className="card-notion">
                  <div className="p-4 border-b border-notion-200 bg-notion-25">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-notion-900 mb-1">Create Your Dashboard</h3>
                        <p className="text-xs text-notion-600 leading-relaxed">
                          Drag fields from the data panel to create charts. Use the toolbar to customize visualizations. 
                          Click "Save Dashboard" when you're ready to save your work.
                        </p>
                      </div>
                    </div>
                  </div>
                  <GraphicWalkerChart
                    dataset={selectedDataset}
                    mode="design"
                    onSave={handleDashboardSave}
                    className="main-chart"
                  />
                </div>
              ) : (
                <div className="card-notion">
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 mx-auto mb-4 bg-notion-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-notion-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="heading-notion text-base mb-2">Select a dataset to start</h3>
                      <p className="text-notion-secondary text-sm mb-4">
                        Choose a dataset from the dropdown above or upload a new CSV file to begin creating your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Tutorial */}
      {showGettingStarted && (
        <GettingStarted onClose={() => setShowGettingStarted(false)} />
      )}

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
