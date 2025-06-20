/**
 * API configuration file
 * Handles environment-specific API endpoints
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;

// Base URLs for different environments
const API_BASE_URLS = {
  development: 'http://localhost:3000',
  production: '',  // Empty string for same-origin requests in production
};

// API endpoints
export const API_ENDPOINTS = {
  BOTMANAGER: '/api/botmanager',
  TWOSTEPS_CHAT: '/api/2steps-chat',
};

// Current environment base URL
export const BASE_URL = API_BASE_URLS[isDevelopment ? 'development' : 'production'];

// Full API URL builder function
export const getApiUrl = (endpoint) => `${BASE_URL}${endpoint}`;

export default {
  BASE_URL,
  API_ENDPOINTS,
  getApiUrl,
};