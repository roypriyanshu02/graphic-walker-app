import React, { useState, useEffect, useMemo } from 'react';
import { GraphicWalker, GraphicRenderer } from '@kanaries/graphic-walker';
import { useDataset } from '../hooks/useDatasets';
import { useDashboardSave } from '../hooks/useDashboards';
import { dataUtils } from '../utils/helpers';
import { MESSAGES } from '../constants/messages';

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
      <div className={`graphic-walker-chart loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`graphic-walker-chart error ${className}`}>
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          {dataset && (
            <button 
              onClick={() => loadData()}
              className="retry-btn"
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
      <div className={`graphic-walker-chart no-data ${className}`}>
        <div className="no-data-container">
          <h3>No Dataset Selected</h3>
          <p>{MESSAGES.SELECT_FROM_DROPDOWN}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`graphic-walker-chart no-data ${className}`}>
        <div className="no-data-container">
          <h3>No Data Available</h3>
          <p>{MESSAGES.NO_DATA_FOUND}</p>
        </div>
      </div>
    );
  }

  // Render chart based on mode
  return (
    <div className={`graphic-walker-chart ${mode} ${className}`}>
      {mode === 'design' ? (
        <GraphicWalker
          data={chartData.dataSource}
          fields={chartData.fields}
          spec={dashboardConfig}
          onSave={async (config, name) => {
            const result = await handleSave(config, name);
            return result !== null;
          }}
          appearance={{
            showSaveButton: true,
            showExportButton: true,
            showDataBoard: true,
            showInsightBoard: true
          }}
        />
      ) : (
        <GraphicRenderer
          data={chartData.dataSource}
          fields={chartData.fields}
          chart={dashboardConfig}
        />
      )}
      
      {saving && (
        <div className="saving-overlay">
          <div className="saving-spinner">
            <div className="spinner"></div>
            <p>Saving dashboard...</p>
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
    return <div className="loading">Loading charts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!chartData || !dashboardConfig) {
    return <div className="no-data">No data available</div>;
  }

  const charts = Array.isArray(dashboardConfig) ? dashboardConfig : [dashboardConfig];

  return (
    <div className={`multiple-charts ${className}`}>
      {charts.map((chartConfig, index) => (
        <div key={index} className="chart-item">
          <h3 className="chart-title">
            {chartConfig.name || `Chart ${index + 1}`}
          </h3>
          <GraphicRenderer
            data={chartData.dataSource}
            fields={chartData.fields}
            chart={chartConfig}
          />
        </div>
      ))}
    </div>
  );
};

export default GraphicWalkerChart;
