// ============================================================
// WEBSOCKET CONFIGURATION
// Real backend connection only - no mock data
// ============================================================

// Get base URL from environment, fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const WS_CONFIG = {
  USE_MOCK_DATA: false, // Real backend only
  WS_URL: `${API_BASE_URL.replace('http', 'ws')}/ws/motor-data`,
  API_BASE: API_BASE_URL,
  START_STREAM: '/start-stream',
  STOP_STREAM: '/stop-stream', 
  ANALYSIS_DATA: '/analysis-data',
  HEALTH_CHECK: '/health',
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
};