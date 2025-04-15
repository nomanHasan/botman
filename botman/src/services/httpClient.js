/**
 * HTTP Client Service
 * Provides a configured axios instance for API requests
 */
import axios from 'axios';
import { BASE_URL } from './config';

// Create axios instance with default configurations
const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    // You can add common request handling here:
    // - Add authentication tokens
    // - Add request logging
    // - Add request parameters
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    // You can add common response handling here:
    // - Transform response data
    // - Log responses
    // - Extract only data property
    
    return response.data;
  },
  (error) => {
    // You can add common error handling here:
    // - Handle authentication errors
    // - Format error messages
    // - Retry logic
    
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    };
    
    return Promise.reject(errorResponse);
  }
);

export default httpClient;