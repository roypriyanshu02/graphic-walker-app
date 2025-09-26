import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../constants';
import { useSettings, useUserGroups } from '../hooks/useSettings';

const SettingsPage = () => {
  const {
    settings,
    isLoading,
    error,
    isSaving,
    getSetting,
    saveSetting,
    saveSettings,
    resetSettings
  } = useSettings();

  const {
    groups,
    isLoading: groupsLoading,
    error: groupsError,
    createGroup
  } = useUserGroups();

  const [activeSection, setActiveSection] = useState('general');
  const [localSettings, setLocalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Initialize local settings when settings load
  useEffect(() => {
    if (!isLoading && settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
    setSaveMessage(''); // Clear any previous messages
  };

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
      setHasChanges(false);
      setSaveMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values?')) {
      try {
        await resetSettings();
        setSaveMessage('Settings reset to defaults successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Failed to reset settings:', error);
        setSaveMessage('Failed to reset settings. Please try again.');
        setTimeout(() => setSaveMessage(''), 5000);
      }
    }
  };

  const sections = [
    { id: 'general', name: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'appearance', name: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5v12a2 2 0 104 0V3z' },
    { id: 'data', name: 'Data & Charts', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'export', name: 'Export', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="page-notion p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <svg className="w-8 h-8 animate-spin mx-auto mb-4 text-accent-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-notion-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-notion p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-notion text-xl mb-2">Settings</h1>
            <p className="text-notion-secondary text-sm">Manage your {APP_CONFIG.NAME} preferences</p>
            {error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            {saveMessage && (
              <div className={`mt-2 text-sm px-3 py-2 rounded-md ${
                saveMessage.includes('Failed') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-green-600 bg-green-50'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving || isLoading}
              className="btn-notion py-2 px-4 text-sm font-medium text-notion-700 border border-notion-300 hover:bg-notion-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isLoading}
              className="btn-notion btn-notion-primary py-2 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="card-notion p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                  activeSection === section.id
                    ? 'bg-accent-100 text-accent-900'
                    : 'text-notion-700 hover:bg-notion-100'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                </svg>
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="card-notion p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h2 className="heading-notion text-base mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-notion-200">
                    <div>
                      <h3 className="text-sm font-medium text-notion-900">Enable Notifications</h3>
                      <p className="text-sm text-notion-500">Receive notifications about data updates and system events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.notifications || false}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-notion-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-notion-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-notion-200">
                    <div>
                      <h3 className="text-sm font-medium text-notion-900">Auto-save Dashboards</h3>
                      <p className="text-sm text-notion-500">Automatically save dashboard changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.autoSave || false}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-notion-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-notion-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="heading-notion text-base mb-4">Appearance</h2>
                
                <div>
                  <label className="block text-sm font-medium text-notion-700 mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['light', 'dark'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleSettingChange('theme', theme)}
                        className={`p-4 border rounded-lg text-left transition-all duration-150 ${
                          localSettings.theme === theme
                            ? 'border-accent-300 bg-accent-50'
                            : 'border-notion-200 hover:border-notion-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${theme === 'light' ? 'bg-warning-400' : 'bg-notion-800'}`}></div>
                          <span className="font-medium capitalize text-notion-900">{theme}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-6">
                <h2 className="heading-notion text-base mb-4">Data & Charts</h2>
                
                <div>
                  <label className="block text-sm font-medium text-notion-700 mb-3">Default Chart Type</label>
                  <select
                    value={localSettings.defaultChartType || 'bar'}
                    onChange={(e) => handleSettingChange('defaultChartType', e.target.value)}
                    className="input-notion"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-notion-700 mb-3">Data Refresh Interval</label>
                  <select
                    value={localSettings.dataRefreshInterval || '5'}
                    onChange={(e) => handleSettingChange('dataRefreshInterval', e.target.value)}
                    className="input-notion"
                  >
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === 'export' && (
              <div className="space-y-6">
                <h2 className="heading-notion text-base mb-4">Export Settings</h2>
                
                <div>
                  <label className="block text-sm font-medium text-notion-700 mb-3">Default Export Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['png', 'svg', 'pdf'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleSettingChange('exportFormat', format)}
                        className={`p-3 border rounded-lg text-center transition-all duration-150 ${
                          localSettings.exportFormat === format
                            ? 'border-accent-300 bg-accent-50 text-accent-700'
                            : 'border-notion-200 hover:border-notion-300 text-notion-700'
                        }`}
                      >
                        <span className="font-medium uppercase">{format}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
