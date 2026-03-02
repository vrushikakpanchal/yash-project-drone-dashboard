// "use client";
// import { createContext, useContext, useEffect, useState, useRef } from "react";
// import { WS_CONFIG } from "@/config/websocket.config";
// import { api, API_ENDPOINTS } from "@/lib/api";

// const WebSocketContext = createContext(null);



// export function WebSocketProvider({ children }) {
//   const [throttle, setThrottle] = useState(35);
//   const [sensorData, setSensorData] = useState({
//     thrust: 450,
//     rpm: 3200,
//     voltage: 11.4,
//     current: 12.5,
//     power: 142.5,
//     pitch: 2,
//     roll: -1,
//     yaw: 0,
//   });
//   const [logs, setLogs] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [connected, setConnected] = useState(false);
//   const [aiModel, setAiModel] = useState(true);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [analysisData, setAnalysisData] = useState(null);
//   const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
//   const wsRef = useRef(null);

//   // API functions for start/stop streaming
//   const startStreaming = async () => {
//     try {
//       console.log('Starting backend streaming...');
//       const result = await api.startStream();
//       setIsStreaming(true);
//       console.log('Started backend streaming:', result);
//     } catch (error) {
//       console.error('Error starting stream:', error);
//       // Show user-friendly error handling here if needed
//     }
//   };

//   const stopStreaming = async () => {
//     try {
//       console.log('Stopping backend streaming...');
//       const result = await api.stopStream();
//       setIsStreaming(false);
//       console.log('Stopped backend streaming:', result);
      
//       if (result.analysis_data_available) {
//         // Fetch analysis data after stopping
//         console.log('Analysis data available, fetching...');
//         await fetchAnalysisData();
//       } else {
//         console.log('No analysis data available yet');
//         setAnalysisData(null);
//       }
//     } catch (error) {
//       console.error('Error stopping stream:', error);
//       setIsStreaming(false);
//     }
//   };

//   const fetchAnalysisData = async () => {
//     try {
//       setIsLoadingAnalysis(true);
//       console.log('Fetching analysis data from:', API_ENDPOINTS.ANALYSIS_DATA);
//       const result = await api.getAnalysisData();
      
//       if (result.status === 'success' && result.data) {
//         setAnalysisData(result.data);
//         console.log('Analysis data fetched successfully:', result.data);
//       } else {
//         console.log('No analysis data available:', result);
//         setAnalysisData(null);
//       }
//     } catch (error) {
//       console.error('Error fetching analysis data:', error);
//       setAnalysisData(null);
//     } finally {
//       setIsLoadingAnalysis(false);
//     }
//   };

//   // ── REAL WEBSOCKET CONNECTION (BACKEND ONLY) ─────────────────────────────────────
//   useEffect(() => {
//     const ws = new WebSocket(WS_CONFIG.WS_URL);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       setConnected(true);
//       console.log('WebSocket connected to backend');
//     };
    
//     ws.onclose = () => {
//       setConnected(false);
//       console.log('WebSocket disconnected');
//     };
    
//     ws.onerror = (error) => {
//       setConnected(false);
//       console.warn('WebSocket connection failed - ensure backend is running on port 8000');
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         // Map backend data to frontend format (thrust is already in proper range from backend)
//         const mappedData = {
//           thrust: +(data.thrust || 0).toFixed(2),
//           rpm: Math.round(data.rpm || 0),
//           voltage: +(data.voltage || 0).toFixed(2),
//           current: +(data.current || 0).toFixed(2),
//           power: +((data.power || (data.voltage * data.current))).toFixed(2),
//           pitch: +(data.pitch || 0).toFixed(2),
//           roll: +(data.roll || 0).toFixed(2),
//           yaw: +(data.yaw || 0).toFixed(2),
//         };
        
//         setSensorData(mappedData);
        
//         const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
//         const logEntry = `${timestamp} — Thrust: ${mappedData.thrust}g | RPM: ${mappedData.rpm} | ${mappedData.voltage}V ${mappedData.current}A`;
        
//         setLogs((prev) => [logEntry, ...prev].slice(0, 100));
//         setHistory((prev) =>
//           [...prev, { time: timestamp, thrust: mappedData.thrust, rpm: mappedData.rpm }].slice(-120)
//         );
//       } catch (e) {
//         console.error("WebSocket parse error:", e);
//       }
//     };

//     return () => {
//       ws.close();
//       console.log('WebSocket connection closed');
//     };
//   }, []);

//   // Send throttle to backend via WebSocket
//   useEffect(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: "throttle", value: throttle }));
//     }
//   }, [throttle]);

//   return (
//     <WebSocketContext.Provider
//       value={{ 
//         sensorData, 
//         throttle, 
//         setThrottle, 
//         logs, 
//         history, 
//         connected, 
//         aiModel,
//         isStreaming,
//         startStreaming,
//         stopStreaming,
//         analysisData,
//         isLoadingAnalysis,
//         fetchAnalysisData
//       }}
//     >
//       {children}
//     </WebSocketContext.Provider>
//   );
// }

// export function useWebSocket() {
//   return useContext(WebSocketContext);
// }


"use client";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { WS_CONFIG } from "@/config/websocket.config";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [throttle,    setThrottle]    = useState(35);
  const [sensorData,  setSensorData]  = useState({
    thrust: 0, rpm: 0, voltage: 0, current: 0, power: 0,
    pitch: 0, roll: 0, yaw: 0,
    severity: 0, anomaly_status: "NORMAL", health: 100, rul: 0, fault_type: "None",
  });
  const [logs,    setLogs]    = useState([]);
  const [history, setHistory] = useState([]);

  // Names that ControlStatus.jsx destructures — must match exactly
  const [isStreaming, setIsStreaming] = useState(false);
  const [connected,   setConnected]  = useState(false);
  const [aiModel]                    = useState(true);

  // Analysis
  const [analysisData,      setAnalysisData]      = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const wsRef = useRef(null);

  // ── Append one data point ──────────────────────────────────
  const appendData = useCallback((data) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    const logEntry =
      `${ts} | Thrust: ${data.thrust}g | RPM: ${data.rpm} | ` +
      `${data.voltage}V ${data.current}A | ${data.anomaly_status}`;
    setSensorData(data);
    setLogs((p)     => [logEntry, ...p].slice(0, 200));
    setHistory((p)  => [...p, { time: ts, thrust: data.thrust, rpm: data.rpm }].slice(-150));
  }, []);

  // ── Fetch analysis data from backend ──────────────────────
  const fetchAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const res = await fetch(`${WS_CONFIG.API_BASE}${WS_CONFIG.ANALYSIS_DATA}`);
      const json = await res.json();
      if (json.status === "success") {
        setAnalysisData(json.data);
        console.log('Analysis data loaded:', json.data);
      } else {
        console.log('No analysis data available:', json.message);
        setAnalysisData(null);
      }
    } catch (e) {
      console.error("Failed to fetch analysis data:", e);
      setAnalysisData(null);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  // ── startStreaming ─────────────────────────────────────────
  // Correct order for real backend:
  //   1. Open WebSocket (so backend has a connection to broadcast to)
  //   2. Wait until WS is open (onopen fires)
  //   3. THEN call POST /start-stream (backend starts pushing data)
  const startStreaming = useCallback(async () => {
    if (isStreaming) return;

    console.log('Starting backend streaming...');
    setAnalysisData(null);
    setHistory([]);
    setLogs([]);

    // Close any stale connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(WS_CONFIG.WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.power === undefined) {
          data.power = +((data.voltage ?? 0) * (data.current ?? 0)).toFixed(1);
        }
        // Multiply thrust by 1000 and limit to 2 decimal places
        if (data.thrust !== undefined) {
          data.thrust = +((data.thrust * 1000).toFixed(2));
        }
        appendData(data);
      } catch (e) {
        console.error("WebSocket parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      setIsStreaming(false);
    };

    ws.onerror = (e) => {
      console.error("WebSocket connection failed:", e);
      setConnected(false);
    };

    // Wait for WebSocket to open, then tell backend to start streaming
    ws.onopen = async () => {
      console.log('WebSocket connected to backend');
      setConnected(true);
      setIsStreaming(true);
      try {
        const res = await fetch(`${WS_CONFIG.API_BASE}${WS_CONFIG.START_STREAM}`, {
          method: "POST",
        });
        const json = await res.json();
        console.log("Backend streaming started:", json);
      } catch (e) {
        console.error("Failed to start backend streaming:", e);
      }
    };
  }, [isStreaming, appendData]);

  // ── stopStreaming ─────────────────────────────────────────
  const stopStreaming = useCallback(async () => {
    console.log('Stopping backend streaming...');
    try {
      const res = await fetch(`${WS_CONFIG.API_BASE}${WS_CONFIG.STOP_STREAM}`, { method: "POST" });
      const json = await res.json();
      console.log('Backend streaming stopped:', json);
    } catch (e) {
      console.error("Failed to stop backend streaming:", e);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsStreaming(false);
    setConnected(false);
  }, []);

  // ── emergencyStop: throttle=0 + stop + fetch analysis ─────
  const emergencyStop = useCallback(async () => {
    setThrottle(0);
    await stopStreaming();
    await fetchAnalysis();
  }, [stopStreaming, fetchAnalysis]);

  return (
    <WebSocketContext.Provider
      value={{
        sensorData,
        throttle,
        setThrottle,
        logs,
        history,
        // Exact names ControlStatus.jsx uses:
        connected,
        aiModel,
        isStreaming,
        startStreaming,
        stopStreaming,
        emergencyStop,
        // Analysis:
        analysisData,
        isLoadingAnalysis,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}