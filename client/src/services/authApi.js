import { API_BASE_URL } from '../constants';

class AuthAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to make API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token if registration is successful
    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    return response;
  }

  // Login user
  async login(credentials) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token if login is successful
    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    return response;
  }

  // Get user profile
  async getProfile() {
    return await this.makeRequest('/auth/profile', {
      method: 'GET',
    });
  }

  // Verify token
  async verifyToken() {
    return await this.makeRequest('/auth/verify', {
      method: 'GET',
    });
  }

  // Logout user
  async logout() {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if the API call fails, we should still clear local storage
      console.warn('Logout API call failed, but clearing local storage:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }
}

const authAPI = new AuthAPI();
export default authAPI;
