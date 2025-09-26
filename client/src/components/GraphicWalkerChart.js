import React, { useState, useEffect, useMemo } from 'react';
import { GraphicWalker, GraphicRenderer } from '@kanaries/graphic-walker';
import { useDataset } from '../hooks/useDatasets';
import { useDashboardSave } from '../hooks/useDashboards';
import { dataUtils } from '../utils/helpers';
import { MESSAGES } from '../constants/messages';
import ErrorBoundary from './ErrorBoundary';

// Default theme configuration for Graphic Walker
const defaultTheme = {
  "primary": "#3b82f6",
  "primaryDark": "#2563eb", 
  "primaryLight": "#93c5fd",
  "background": "#ffffff",
  "backgroundAlt": "#f8fafc",
  "foreground": "#1e293b",
  "foregroundAlt": "#64748b",
  "border": "#e2e8f0",
  "borderAlt": "#cbd5e1",
  "success": "#10b981",
  "warning": "#f59e0b",
  "error": "#ef4444",
  "info": "#3b82f6"
};

// Configuration for Graphic Walker appearance
const defaultAppearance = {
  showSaveButton: true,
  showExportButton: true,
  showDataBoard: true,
  showInsightBoard: true,
  theme: 'light'
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
  
  const { data: datasetData, loadData } = useDataset(dataset?.datasetName);
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

  // Handle save dashboard
  const handleSave = async (config, dashboardName) => {
    if (!dataset || !chartData) return;

    const dashboardData = {
      dashboardName: dashboardName,
      datasetName: dataset.datasetName,
      jsonFormat: JSON.stringify(config),
      isMultiple: Array.isArray(config) && config.length > 1
    };

    const result = await saveDashboard(dashboardData);
    if (result && onSave) {
      onSave(result);
    }
    
    return result;
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
      console.log('Rendering GraphicWalker with data:', {
        dataSource: chartData.dataSource?.length,
        fields: chartData.fields?.length,
        mode,
        dashboardConfig
      });

      if (mode === 'design') {
        return (
          <ErrorBoundary>
            <GraphicWalker
              data={chartData.dataSource}
              fields={chartData.fields}
              spec={dashboardConfig || []}
              onSave={async (config, name) => {
                const result = await handleSave(config, name);
                return result !== null;
              }}
            />
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
      
      {saving && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <p className="text-gray-700 font-medium">Saving dashboard...</p>
          </div>
        </div>
      )}
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
  
  const { data: datasetData, loadData } = useDataset(dataset?.datasetName);

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
