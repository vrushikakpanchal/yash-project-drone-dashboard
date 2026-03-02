// API configuration and utilities for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  START_STREAM: `${API_BASE_URL}/start-stream`,
  STOP_STREAM: `${API_BASE_URL}/stop-stream`,
  ANALYSIS_DATA: `${API_BASE_URL}/analysis-data`,
  HEALTH_CHECK: `${API_BASE_URL}/health`,
  GET_DATA: `${API_BASE_URL}/get-data`,
};

// WebSocket URL
export const WS_URL = `${API_BASE_URL.replace('http', 'ws')}/ws/motor-data`;

// API call helper with error handling
export async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
}

// Specific API functions
export const api = {
  startStream: () => apiCall(API_ENDPOINTS.START_STREAM, { method: 'POST' }),
  stopStream: () => apiCall(API_ENDPOINTS.STOP_STREAM, { method: 'POST' }),
  getAnalysisData: () => apiCall(API_ENDPOINTS.ANALYSIS_DATA),
  healthCheck: () => apiCall(API_ENDPOINTS.HEALTH_CHECK),
  getData: () => apiCall(API_ENDPOINTS.GET_DATA),
};

export default api;