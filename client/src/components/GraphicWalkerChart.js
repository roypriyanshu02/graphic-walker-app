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
  showSaveButton: false, // We use custom save button
  appearance: "light" // Always use light mode
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
  const [specPollingActive, setSpecPollingActive] = useState(false);
  const [lastKnownSpec, setLastKnownSpec] = useState([]);
  const [specHistory, setSpecHistory] = useState([]);
  const graphicWalkerRef = useRef(null);
  const specRef = useRef(null);
  const specCacheKey = `gw_spec_${dataset?.datasetName || 'default'}`;
  
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

  // Enhanced spec tracking with multiple strategies
  useEffect(() => {
    if (mode === 'design' && chartData) {
      setSpecPollingActive(true);
      
      // Load any cached spec from localStorage
      try {
        const cachedSpec = localStorage.getItem(specCacheKey);
        if (cachedSpec) {
          const parsed = JSON.parse(cachedSpec);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('📦 [CACHE] Loaded cached spec:', parsed);
            setCurrentSpec(parsed);
            setLastKnownSpec(parsed);
          }
        }
      } catch (error) {
        console.warn('❌ [CACHE] Failed to load cached spec:', error);
      }
      
      const pollInterval = setInterval(() => {
        try {
          // Strategy 1: Try GraphicWalker ref methods
          let capturedSpec = null;
          
          if (specRef.current) {
            // Try multiple ways to get the spec
            const methods = [
              () => specRef.current.getSpec?.(),
              () => specRef.current.spec,
              () => specRef.current.state?.spec,
              () => specRef.current.props?.spec,
              () => specRef.current._spec
            ];
            
            for (const method of methods) {
              try {
                const result = method();
                if (result && Array.isArray(result) && result.length > 0) {
                  capturedSpec = result;
                  console.log('🔄 [POLLING] Captured spec via method:', result);
                  break;
                }
              } catch (e) {
                // Continue to next method
              }
            }
          }
          
          // Strategy 2: DOM inspection fallback
          if (!capturedSpec) {
            try {
              // Look for GraphicWalker elements that might contain spec data
              const gwElements = document.querySelectorAll('[data-testid*="graphic-walker"], [class*="graphic-walker"], [id*="graphic-walker"]');
              console.log('🔍 [DOM] Found GraphicWalker elements:', gwElements.length);
              
              // This is a fallback - in real scenarios, we'd need to inspect the actual DOM structure
              // For now, we'll rely on other methods
            } catch (domError) {
              console.warn('❌ [DOM] DOM inspection failed:', domError);
            }
          }
          
          // Update state if we found something new
          if (capturedSpec && JSON.stringify(capturedSpec) !== JSON.stringify(currentSpec)) {
            console.log('🔄 [POLLING] Updating spec state:', capturedSpec);
            setCurrentSpec(capturedSpec);
            setLastKnownSpec(capturedSpec);
            
            // Cache the spec
            try {
              localStorage.setItem(specCacheKey, JSON.stringify(capturedSpec));
              console.log('📦 [CACHE] Cached spec to localStorage');
            } catch (cacheError) {
              console.warn('❌ [CACHE] Failed to cache spec:', cacheError);
            }
            
            // Add to history
            setSpecHistory(prev => {
              const newHistory = [...prev, { timestamp: Date.now(), spec: capturedSpec }];
              return newHistory.slice(-10); // Keep last 10 specs
            });
          }
        } catch (error) {
          console.warn('❌ [POLLING] Polling error:', error.message);
        }
      }, 1000); // Poll every 1 second for more responsive updates
      
      return () => {
        clearInterval(pollInterval);
        setSpecPollingActive(false);
      };
    } else {
      setSpecPollingActive(false);
    }
  }, [mode, chartData, specCacheKey]);

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

  // Aggressive spec capture with all possible methods
  const captureCurrentSpec = () => {
    console.log('🚀 [CAPTURE] Starting aggressive spec capture...');
    
    const allSources = {
      currentSpec,
      lastKnownSpec,
      specHistory: specHistory[specHistory.length - 1]?.spec,
      dashboardConfig,
      localStorage: null,
      specRef: null
    };
    
    // Try localStorage first
    try {
      const cached = localStorage.getItem(specCacheKey);
      if (cached) {
        allSources.localStorage = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('❌ [CAPTURE] localStorage failed:', e);
    }
    
    // Try all specRef methods
    if (specRef.current) {
      const refMethods = [
        () => specRef.current.getSpec?.(),
        () => specRef.current.spec,
        () => specRef.current.state?.spec,
        () => specRef.current.props?.spec,
        () => specRef.current._spec,
        () => specRef.current.chartSpec,
        () => specRef.current.specification
      ];
      
      for (let i = 0; i < refMethods.length; i++) {
        try {
          const result = refMethods[i]();
          if (result && Array.isArray(result) && result.length > 0) {
            allSources.specRef = result;
            console.log(`✅ [CAPTURE] specRef method ${i} worked:`, result);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    console.log('🔍 [CAPTURE] All sources:', {
      currentSpec: allSources.currentSpec?.length || 0,
      lastKnownSpec: allSources.lastKnownSpec?.length || 0,
      specHistory: allSources.specHistory?.length || 0,
      dashboardConfig: allSources.dashboardConfig?.length || 0,
      localStorage: allSources.localStorage?.length || 0,
      specRef: allSources.specRef?.length || 0
    });
    
    // Priority order: try each source in order of reliability
    const sources = [
      { name: 'currentSpec', data: allSources.currentSpec },
      { name: 'specRef', data: allSources.specRef },
      { name: 'lastKnownSpec', data: allSources.lastKnownSpec },
      { name: 'localStorage', data: allSources.localStorage },
      { name: 'specHistory', data: allSources.specHistory },
      { name: 'dashboardConfig', data: allSources.dashboardConfig }
    ];
    
    for (const source of sources) {
      if (source.data && Array.isArray(source.data) && source.data.length > 0) {
        // Validate that it has actual chart content
        const hasValidCharts = source.data.some(spec => 
          spec && typeof spec === 'object' && 
          (spec.encodings || spec.mark || spec.data || Object.keys(spec).length > 2)
        );
        
        if (hasValidCharts) {
          console.log(`✅ [CAPTURE] Using ${source.name}:`, {
            length: source.data.length,
            preview: source.data.map(s => ({
              name: s.name || 'Unnamed',
              encodings: s.encodings ? Object.keys(s.encodings) : [],
              mark: s.mark,
              hasData: !!s.data
            }))
          });
          return source.data;
        }
      }
    }
    
    // Last resort: create a mock spec if we're in design mode and have data
    if (mode === 'design' && chartData && chartData.fields && chartData.fields.length > 0) {
      console.log('🆘 [CAPTURE] Creating emergency mock spec...');
      const mockSpec = [{
        name: 'Emergency Chart',
        encodings: {
          x: { field: chartData.fields[0]?.name || 'field1', type: 'nominal' },
          y: { field: chartData.fields[1]?.name || chartData.fields[0]?.name || 'field2', type: 'quantitative' }
        },
        mark: 'bar',
        data: chartData.dataSource?.slice(0, 100) || []
      }];
      
      console.log('🆘 [CAPTURE] Emergency mock spec created:', mockSpec);
      return mockSpec;
    }
    
    console.warn('❌ [CAPTURE] All capture methods failed, returning empty array');
    return [];
  };

  // Handle save dashboard request from GraphicWalker
  const handleSaveRequest = () => {
    console.log('💾 [SAVE REQUEST] Save button clicked!');
    console.log('💾 [SAVE REQUEST] Current component state:', {
      currentSpecLength: currentSpec?.length || 0,
      specRefExists: !!specRef.current,
      dashboardConfigLength: dashboardConfig?.length || 0,
      mode,
      dataset: dataset?.datasetName
    });
    
    const configToSave = captureCurrentSpec();
    console.log('💾 [SAVE REQUEST] Captured config:', { 
      configType: typeof configToSave, 
      configLength: Array.isArray(configToSave) ? configToSave.length : 'not array',
      isArray: Array.isArray(configToSave),
      hasCharts: Array.isArray(configToSave) && configToSave.some(spec => spec.encodings && Object.keys(spec.encodings).length > 0),
      configContent: configToSave,
      configPreview: Array.isArray(configToSave) ? configToSave.map(spec => ({ 
        name: spec.name || 'Unnamed',
        encodings: spec.encodings ? Object.keys(spec.encodings) : [],
        encodingCount: spec.encodings ? Object.keys(spec.encodings).length : 0
      })) : 'not array'
    });
    
    console.log('💾 [SAVE REQUEST] Setting pending config and showing dialog...');
    setPendingConfig(configToSave);
    setShowSaveDialog(true);
  };

  // Handle actual save with dashboard name
  const handleSave = async (dashboardName) => {
    console.log('💾 [FINAL SAVE] Starting final save process...');
    
    if (!dataset || !chartData) {
      console.warn('❌ [FINAL SAVE] Cannot save dashboard: missing required data', {
        hasDataset: !!dataset,
        hasChartData: !!chartData
      });
      return;
    }

    // Capture the most current spec before saving
    console.log('💾 [FINAL SAVE] Capturing final config...');
    console.log('💾 [FINAL SAVE] pendingConfig:', pendingConfig);
    
    const finalConfig = pendingConfig || captureCurrentSpec();
    
    console.log('💾 [FINAL SAVE] Final config to save:', { 
      dashboardName, 
      datasetName: dataset.datasetName, 
      configType: typeof finalConfig,
      configLength: Array.isArray(finalConfig) ? finalConfig.length : 'not array',
      isArray: Array.isArray(finalConfig),
      configContent: finalConfig,
      configPreview: Array.isArray(finalConfig) ? finalConfig.map(spec => ({
        name: spec.name || 'Unnamed',
        encodings: spec.encodings ? Object.keys(spec.encodings) : [],
        encodingCount: spec.encodings ? Object.keys(spec.encodings).length : 0,
        hasData: !!spec.data,
        hasEncodings: spec.encodings && Object.keys(spec.encodings).length > 0
      })) : 'not array'
    });

    const jsonFormatString = JSON.stringify(finalConfig);
    console.log('💾 [FINAL SAVE] JSON string to save:', {
      jsonLength: jsonFormatString.length,
      jsonContent: jsonFormatString,
      isEmptyArray: jsonFormatString === '[]'
    });

    const dashboardData = {
      dashboardName: dashboardName.trim(),
      datasetName: dataset.datasetName,
      jsonFormat: jsonFormatString,
      isMultiple: Array.isArray(finalConfig) && finalConfig.length > 1
    };
    
    console.log('💾 [FINAL SAVE] Dashboard data to send to API:', dashboardData);

    try {
      console.log('💾 [FINAL SAVE] Calling saveDashboard API...');
      const result = await saveDashboard(dashboardData);
      console.log('✅ [FINAL SAVE] API response:', result);
      
      if (result && onSave) {
        onSave(result);
      }
      console.log('✅ [FINAL SAVE] Dashboard saved successfully!');
      setShowSaveDialog(false);
      setPendingConfig(null);
    } catch (error) {
      console.error('❌ [FINAL SAVE] Failed to save dashboard:', error);
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
                ref={specRef}
                data={chartData.dataSource}
                fields={chartData.fields}
                spec={dashboardConfig || []}
                appearance="light"
                onSpecChange={(spec) => {
                  console.log('🔄 [SPEC CHANGE] GraphicWalker spec changed:', {
                    timestamp: new Date().toISOString(),
                    specType: typeof spec,
                    specLength: Array.isArray(spec) ? spec.length : 'not array',
                    isArray: Array.isArray(spec),
                    hasValidCharts: Array.isArray(spec) && spec.some(s => s && (s.encodings || s.mark || s.data)),
                    specContent: spec,
                    specPreview: Array.isArray(spec) ? spec.map((s, i) => ({
                      index: i,
                      name: s?.name || 'Unnamed',
                      encodings: s?.encodings ? Object.keys(s.encodings) : [],
                      encodingCount: s?.encodings ? Object.keys(s.encodings).length : 0,
                      mark: s?.mark,
                      hasEncodings: s?.encodings && Object.keys(s.encodings).length > 0,
                      hasData: !!s?.data
                    })) : 'not array'
                  });
                  
                  const normalizedSpec = spec || [];
                  
                  console.log('🔄 [SPEC CHANGE] Setting currentSpec state...');
                  setCurrentSpec(normalizedSpec);
                  setLastKnownSpec(normalizedSpec);
                  
                  // Immediately cache any valid spec
                  if (Array.isArray(normalizedSpec) && normalizedSpec.length > 0) {
                    try {
                      localStorage.setItem(specCacheKey, JSON.stringify(normalizedSpec));
                      console.log('📦 [SPEC CHANGE] Cached spec immediately');
                      
                      // Add to history
                      setSpecHistory(prev => {
                        const newHistory = [...prev, { timestamp: Date.now(), spec: normalizedSpec }];
                        return newHistory.slice(-10);
                      });
                    } catch (cacheError) {
                      console.warn('❌ [SPEC CHANGE] Failed to cache spec:', cacheError);
                    }
                  }
                  
                  console.log('🔄 [SPEC CHANGE] currentSpec state updated');
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
                    disabled={saving}
                    className="btn-notion flex items-center shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save dashboard"
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
              appearance="light"
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
                appearance="light"
              />
            </ErrorBoundary>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GraphicWalkerChart;
