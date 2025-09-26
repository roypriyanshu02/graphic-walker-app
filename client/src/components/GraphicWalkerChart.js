import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GraphicWalker, GraphicRenderer } from '@kanaries/graphic-walker';
import { useDataset } from '../hooks/useDatasets';
import { useDashboardSave } from '../hooks/useDashboards';
import { dataUtils } from '../utils/helpers';
import { MESSAGES } from '../constants/messages';
import ErrorBoundary from './ErrorBoundary';
import DashboardCreateDialog from './DashboardCreateDialog';

// Minimal appearance configuration for Graphic Walker
const defaultAppearance = {
  showSaveButton: false // We use custom save button
};

const GraphicWalkerChart = ({ 
  dataset, 
  dashboard = null, 
  mode = 'design', // 'design' or 'view'
  onSave = null,
  className = ''
}) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);
  const [currentSpec, setCurrentSpec] = useState([]);
  const graphicWalkerRef = useRef(null);
  
  const { loadData } = useDataset(dataset?.datasetName);
  const { saving, saveDashboard } = useDashboardSave();

  // Load dataset data when dataset changes
  useEffect(() => {
    if (dataset && dataset.datasetName) {
      setLoading(true);
      setError(null);
      
      loadData()
        .then((result) => {
          if (result && result.records) {
            const cleanedData = dataUtils.cleanData(result.records);
            const gwData = dataUtils.convertToGraphicWalkerFormat(cleanedData);
            
            // Validate the data structure before setting
            if (gwData && Array.isArray(gwData.dataSource) && Array.isArray(gwData.fields)) {
              console.log('Chart data loaded successfully:', {
                dataSourceLength: gwData.dataSource.length,
                fieldsLength: gwData.fields.length,
                fields: gwData.fields.map(f => ({ name: f.name, type: f.semanticType }))
              });
              setChartData(gwData);
            } else {
              console.error('Invalid data structure from convertToGraphicWalkerFormat:', gwData);
              setError('Invalid data format received');
            }
          } else {
            setError(MESSAGES.NO_DATA_FOUND);
          }
        })
        .catch((err) => {
          console.error('Error loading dataset:', err);
          setError(err.message || 'Failed to load dataset');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setChartData(null);
    }
  }, [dataset, loadData]);

  // Parse dashboard configuration
  const dashboardConfig = useMemo(() => {
    if (dashboard && dashboard.jsonFormat) {
      try {
        return JSON.parse(dashboard.jsonFormat);
      } catch (error) {
        console.error('Failed to parse dashboard config:', error);
        return null;
      }
    }
    return null;
  }, [dashboard]);

  // Handle save dashboard request from GraphicWalker
  const handleSaveRequest = () => {
    // Use current spec state which gets updated by GraphicWalker
    const configToSave = currentSpec && currentSpec.length > 0 ? currentSpec : dashboardConfig || [];
    console.log('Save request received:', { 
      configType: typeof configToSave, 
      configLength: Array.isArray(configToSave) ? configToSave.length : 'not array',
      hasCharts: Array.isArray(configToSave) && configToSave.some(spec => spec.encodings && Object.keys(spec.encodings).length > 0)
    });
    
    // Check if there's actually something to save
    if (!configToSave || (Array.isArray(configToSave) && configToSave.length === 0)) {
      console.warn('No chart configuration to save');
      // You might want to show a message to the user here
      return;
    }
    
    setPendingConfig(configToSave);
    setShowSaveDialog(true);
  };

  // Handle actual save with dashboard name
  const handleSave = async (dashboardName) => {
    if (!dataset || !chartData || !pendingConfig) {
      console.warn('Cannot save dashboard: missing required data');
      return;
    }

    console.log('Saving dashboard:', { dashboardName, datasetName: dataset.datasetName, configLength: Array.isArray(pendingConfig) ? pendingConfig.length : 'not array' });

    const dashboardData = {
      dashboardName: dashboardName.trim(),
      datasetName: dataset.datasetName,
      jsonFormat: JSON.stringify(pendingConfig),
      isMultiple: Array.isArray(pendingConfig) && pendingConfig.length > 1
    };

    try {
      const result = await saveDashboard(dashboardData);
      if (result && onSave) {
        onSave(result);
      }
      console.log('Dashboard saved successfully:', result);
      setShowSaveDialog(false);
      setPendingConfig(null);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  };

  // Handle save dialog close
  const handleSaveDialogClose = () => {
    setShowSaveDialog(false);
    setPendingConfig(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 bg-white ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">{MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-96 bg-white ${className}`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Chart</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {dataset && (
            <button 
              onClick={() => loadData()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render no data state
  if (!dataset) {
    return (
      <div className={`flex items-center justify-center min-h-96 bg-gray-50 ${className}`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Dataset Selected</h3>
          <p className="text-gray-600">{MESSAGES.SELECT_FROM_DROPDOWN}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center min-h-96 bg-gray-50 ${className}`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Data Available</h3>
          <p className="text-gray-600">{MESSAGES.NO_DATA_FOUND}</p>
        </div>
      </div>
    );
  }

  // Add error boundary for GraphicWalker components
  const renderGraphicWalker = () => {
    try {
      // Validate chart data before rendering
      if (!chartData || !chartData.dataSource || !chartData.fields) {
        console.warn('Invalid chart data structure:', chartData);
        return (
          <div className="flex items-center justify-center min-h-96 bg-notion-50">
            <div className="text-center">
              <p className="text-notion-600">Invalid data structure</p>
            </div>
          </div>
        );
      }

      console.log('Rendering GraphicWalker with data:', {
        dataSource: chartData.dataSource?.length,
        fields: chartData.fields?.length,
        mode,
        dashboardConfig
      });

      if (mode === 'design') {
        return (
          <ErrorBoundary>
            <div className="relative h-full">
              <GraphicWalker
                data={chartData.dataSource}
                fields={chartData.fields}
                spec={dashboardConfig || []}
                onSpecChange={(spec) => {
                  console.log('Spec changed:', spec);
                  setCurrentSpec(spec || []);
                }}
              />
              
              {/* Custom Save Button */}
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center space-x-2">
                  {/* Chart Count Indicator */}
                  {currentSpec && currentSpec.length > 0 && (
                    <div className="px-2 py-1 bg-white border border-notion-200 rounded-md text-xs text-notion-600 shadow-sm">
                      {currentSpec.length} chart{currentSpec.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  <button
                    onClick={handleSaveRequest}
                    disabled={saving || !currentSpec || currentSpec.length === 0}
                    className="btn-notion flex items-center shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!currentSpec || currentSpec.length === 0 ? 'Create a chart first' : 'Save dashboard'}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2H9z" />
                        </svg>
                        Save Dashboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        );
      } else {
        return (
          <ErrorBoundary>
            <GraphicRenderer
              data={chartData.dataSource}
              fields={chartData.fields}
              chart={dashboardConfig || []}
            />
          </ErrorBoundary>
        );
      }
    } catch (error) {
      console.error('Error rendering GraphicWalker:', error);
      return (
        <div className="flex items-center justify-center min-h-96 bg-red-50">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Graphic Walker Error</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
          </div>
        </div>
      );
    }
  };

  // Render chart based on mode
  return (
    <div className={`relative h-full w-full bg-white ${className}`}>
      <div className="h-full w-full">
        {renderGraphicWalker()}
      </div>
      
      {/* Save Dashboard Dialog */}
      <DashboardCreateDialog
        isOpen={showSaveDialog}
        onClose={handleSaveDialogClose}
        onSave={handleSave}
        datasetName={dataset?.datasetName || ''}
        isLoading={saving}
      />
    </div>
  );
};

// Component for rendering multiple charts
export const MultipleChartsRenderer = ({ 
  dataset, 
  dashboardConfig, 
  className = '' 
}) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { loadData } = useDataset(dataset?.datasetName);

  // Load dataset data
  useEffect(() => {
    if (dataset && dataset.datasetName) {
      setLoading(true);
      setError(null);
      
      loadData()
        .then((result) => {
          if (result && result.records) {
            const cleanedData = dataUtils.cleanData(result.records);
            const gwData = dataUtils.convertToGraphicWalkerFormat(cleanedData);
            setChartData(gwData);
          } else {
            setError(MESSAGES.NO_DATA_FOUND);
          }
        })
        .catch((err) => {
          setError(err.message || MESSAGES.FETCH_ERROR);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dataset, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading charts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Charts</h3>
          <p className="text-gray-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!chartData || !dashboardConfig) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Data Available</h3>
          <p className="text-gray-600">No chart data or configuration found</p>
        </div>
      </div>
    );
  }

  const charts = Array.isArray(dashboardConfig) ? dashboardConfig : [dashboardConfig];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 ${className}`}>
      {charts.map((chartConfig, index) => (
        <div key={index} className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {chartConfig.name || `Chart ${index + 1}`}
            </h3>
          </div>
          <div className="p-4">
            <ErrorBoundary>
              <GraphicRenderer
                data={chartData.dataSource}
                fields={chartData.fields}
                chart={chartConfig || {}}
              />
            </ErrorBoundary>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GraphicWalkerChart;
