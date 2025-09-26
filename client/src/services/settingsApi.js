import authAPI from './authApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class SettingsAPI {
  // Helper method to make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const token = authAPI.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Get all user settings
  async getUserSettings() {
    try {
      const response = await this.makeRequest('/settings');
      return response;
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      throw error;
    }
  }

  // Get specific user setting
  async getUserSetting(key) {
    try {
      const response = await this.makeRequest(`/settings/${key}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch user setting '${key}':`, error);
      throw error;
    }
  }

  // Save single user setting
  async saveUserSetting(key, value, type = 'string', isGlobal = false) {
    try {
      const response = await this.makeRequest(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, type, isGlobal }),
      });
      return response;
    } catch (error) {
      console.error(`Failed to save user setting '${key}':`, error);
      throw error;
    }
  }

  // Save multiple user settings
  async saveUserSettings(settings) {
    try {
      const response = await this.makeRequest('/settings/bulk', {
        method: 'POST',
        body: JSON.stringify({ settings }),
      });
      return response;
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw error;
    }
  }

  // Delete user setting
  async deleteUserSetting(key) {
    try {
      const response = await this.makeRequest(`/settings/${key}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Failed to delete user setting '${key}':`, error);
      throw error;
    }
  }

  // User Groups API methods

  // Get user groups
  async getUserGroups() {
    try {
      const response = await this.makeRequest('/settings/groups/my');
      return response;
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
      throw error;
    }
  }

  // Create user group
  async createUserGroup(groupName, description = '') {
    try {
      const response = await this.makeRequest('/settings/groups', {
        method: 'POST',
        body: JSON.stringify({ groupName, description }),
      });
      return response;
    } catch (error) {
      console.error('Failed to create user group:', error);
      throw error;
    }
  }

  // Get group settings
  async getGroupSettings(groupId) {
    try {
      const response = await this.makeRequest(`/settings/groups/${groupId}/settings`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch group settings for group '${groupId}':`, error);
      throw error;
    }
  }

  // Save group setting
  async saveGroupSetting(groupId, key, value, type = 'string') {
    try {
      const response = await this.makeRequest(`/settings/groups/${groupId}/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, type }),
      });
      return response;
    } catch (error) {
      console.error(`Failed to save group setting '${key}' for group '${groupId}':`, error);
      throw error;
    }
  }

  // Helper methods for common setting types

  // Save boolean setting
  async saveBooleanSetting(key, value, isGlobal = false) {
    return this.saveUserSetting(key, value, 'boolean', isGlobal);
  }

  // Save number setting
  async saveNumberSetting(key, value, isGlobal = false) {
    return this.saveUserSetting(key, value, 'number', isGlobal);
  }

  // Save JSON setting
  async saveJsonSetting(key, value, isGlobal = false) {
    return this.saveUserSetting(key, value, 'json', isGlobal);
  }

  // Get setting value with default fallback
  async getSettingValue(key, defaultValue = null) {
    try {
      const response = await this.getUserSetting(key);
      return response.data.setting[key]?.value ?? defaultValue;
    } catch (error) {
      // Return default value if setting doesn't exist
      if (error.message.includes('Setting not found')) {
        return defaultValue;
      }
      throw error;
    }
  }

  // Batch update settings with proper types
  async updateSettings(settingsObject) {
    const formattedSettings = {};
    
    for (const [key, value] of Object.entries(settingsObject)) {
      // Determine type based on value
      let type = 'string';
      if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'object' && value !== null) {
        type = 'json';
      }
      
      formattedSettings[key] = {
        value,
        type,
        isGlobal: false
      };
    }
    
    return this.saveUserSettings(formattedSettings);
  }
}

const settingsAPI = new SettingsAPI();
export default settingsAPI;
