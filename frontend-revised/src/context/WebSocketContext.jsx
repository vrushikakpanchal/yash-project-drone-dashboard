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
  const backendBaseRef = useRef(WS_CONFIG.API_BASE);
  const shouldStreamRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const targetDataRef = useRef(sensorData);
  const smoothTimerRef = useRef(null);

  // ── Append one data point ──────────────────────────────────
  const appendData = useCallback((data) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    const logEntry =
      `${ts} | Thrust: ${data.thrust}g | RPM: ${data.rpm} | ` +
      `${data.voltage}V ${data.current}A | ${data.anomaly_status}`;
    targetDataRef.current = data;
    setSensorData((prev) => ({
      ...prev,
      anomaly_status: data.anomaly_status,
      fault_type: data.fault_type,
    }));
    setLogs((p)     => [logEntry, ...p].slice(0, 200));
    setHistory((p)  => [...p, { time: ts, thrust: data.thrust, rpm: data.rpm }].slice(-150));
  }, []);

  const mapIncomingData = useCallback((raw) => {
    const rpm = Number(raw?.rpm ?? 0);
    const voltage = Number(raw?.voltage ?? 0);
    const current = Number(raw?.current ?? 0);
    const power = raw?.power === undefined
      ? voltage * current
      : Number(raw.power);

    const rawThrust = Number(raw?.thrust ?? 0);
    // Backend currently emits thrust in kgf; convert to grams for UI gauges.
    const thrust = rawThrust <= 5 ? rawThrust * 1000 : rawThrust;

    return {
      ...raw,
      thrust: +thrust.toFixed(2),
      rpm: +rpm.toFixed(2),
      voltage: +voltage.toFixed(3),
      current: +current.toFixed(3),
      power: +power.toFixed(3),
      severity: +(Number(raw?.severity ?? 0)).toFixed(4),
      health: +(Number(raw?.health ?? 100)).toFixed(2),
      rul: +(Number(raw?.rul ?? 0)).toFixed(2),
      anomaly_status: raw?.anomaly_status ?? "NORMAL",
      fault_type: raw?.fault_type ?? "None",
      pitch: +(Number(raw?.pitch ?? 0)).toFixed(2),
      roll: +(Number(raw?.roll ?? 0)).toFixed(2),
      yaw: +(Number(raw?.yaw ?? 0)).toFixed(2),
    };
  }, []);

  const getBackendCandidates = useCallback(() => {
    const candidates = new Set();

    // Same-origin proxy route (avoids browser CORS/mixed-origin issues).
    candidates.add("/api/backend");

    if (backendBaseRef.current) candidates.add(backendBaseRef.current);
    if (WS_CONFIG.API_BASE) candidates.add(WS_CONFIG.API_BASE);

    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      const pageProtoBase = `${protocol}//${hostname}:8000`;
      candidates.add(pageProtoBase);
      candidates.add(`http://${hostname}:8000`);
      candidates.add(`http://localhost:8000`);
      candidates.add(`http://127.0.0.1:8000`);
    }

    return Array.from(candidates);
  }, []);

  const resolveBackendBase = useCallback(async () => {
    const candidates = getBackendCandidates();

    for (const base of candidates) {
      if (!/^https?:\/\//i.test(base)) {
        continue;
      }
      try {
        const res = await fetch(`${base}${WS_CONFIG.HEALTH_CHECK}`, {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          backendBaseRef.current = base;
          return base;
        }
      } catch {
        // try next candidate
      }
    }

    return null;
  }, [getBackendCandidates]);

  const fetchBackendJson = useCallback(
    async (path, options = {}) => {
      const primary = backendBaseRef.current;
      const ordered = [
        ...(primary ? [primary] : []),
        ...getBackendCandidates().filter((base) => base !== primary),
      ];

      let lastError = null;
      for (const base of ordered) {
        try {
          const res = await fetch(`${base}${path}`, {
            cache: "no-store",
            ...options,
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }
          backendBaseRef.current = base;
          const json = await res.json();
          return { base, json };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error("Backend request failed");
    },
    [getBackendCandidates]
  );

  // ── Fetch analysis data from backend ──────────────────────
  const fetchAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const { json } = await fetchBackendJson(WS_CONFIG.ANALYSIS_DATA);
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
  }, [fetchBackendJson]);

  // ── startStreaming ─────────────────────────────────────────
  // Correct order for real backend:
  //   1. Open WebSocket (so backend has a connection to broadcast to)
  //   2. Wait until WS is open (onopen fires)
  //   3. THEN call POST /start-stream (backend starts pushing data)
  const startStreaming = useCallback(async () => {
    if (isStreaming) return;
    shouldStreamRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    console.log('Starting backend streaming...');
    setAnalysisData(null);
    setHistory([]);
    setLogs([]);

    // Close any stale connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const backendBase = await resolveBackendBase();
    if (!backendBase) {
      console.error(
        "No reachable backend found. Start backend on port 8000 and verify NEXT_PUBLIC_BACKEND_URL."
      );
      setConnected(false);
      setIsStreaming(false);
      return;
    }

    const wsUrl = `${backendBase.replace(/^http/, "ws")}/ws/motor-data`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        appendData(mapIncomingData(raw));
      } catch (e) {
        console.error("WebSocket parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      if (shouldStreamRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          startStreaming();
        }, WS_CONFIG.RECONNECT_INTERVAL || 3000);
      } else {
        setIsStreaming(false);
      }
    };

    ws.onerror = () => {
      console.warn(
        `WebSocket connection failed to ${wsUrl}. ` +
        `Ensure backend is running: cd backend && uvicorn app:app --port 8000`
      );
      setConnected(false);
    };

    // Wait for WebSocket to open, then tell backend to start streaming
    ws.onopen = async () => {
      console.log('WebSocket connected to backend');
      setConnected(true);
      setIsStreaming(true);

      // Push current throttle as soon as socket opens so backend sim starts from UI value.
      ws.send(JSON.stringify({ type: "throttle", value: throttle }));

      try {
        const { json } = await fetchBackendJson(WS_CONFIG.START_STREAM, {
          method: "POST",
        });
        console.log("Backend streaming started:", json);
      } catch (e) {
        console.error("Failed to start backend streaming:", e);
      }
    };
  }, [isStreaming, appendData, mapIncomingData, throttle, fetchBackendJson, resolveBackendBase]);

  // ── stopStreaming ─────────────────────────────────────────
  const stopStreaming = useCallback(async () => {
    shouldStreamRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    console.log('Stopping backend streaming...');
    try {
      const { json } = await fetchBackendJson(WS_CONFIG.STOP_STREAM, { method: "POST" });
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
  }, [fetchBackendJson]);

  // ── emergencyStop: throttle=0 + stop + fetch analysis ─────
  const emergencyStop = useCallback(async () => {
    shouldStreamRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setThrottle(0);
    await stopStreaming();
    await fetchAnalysis();
  }, [stopStreaming, fetchAnalysis]);

  // Keep backend throttle synchronized with slider while streaming.
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "throttle", value: throttle }));
    }
  }, [throttle]);

  // Smoothly move displayed values toward latest backend snapshot.
  useEffect(() => {
    const smoothKeys = [
      "thrust", "rpm", "voltage", "current", "power",
      "pitch", "roll", "yaw", "severity", "health", "rul",
      "vibration", "temperature",
    ];

    if (smoothTimerRef.current) {
      clearInterval(smoothTimerRef.current);
      smoothTimerRef.current = null;
    }

    if (!isStreaming) {
      setSensorData((prev) => ({ ...prev, ...targetDataRef.current }));
      return;
    }

    smoothTimerRef.current = setInterval(() => {
      const target = targetDataRef.current;
      setSensorData((prev) => {
        const next = { ...prev, anomaly_status: target.anomaly_status, fault_type: target.fault_type };
        for (const key of smoothKeys) {
          const cur = Number(prev[key] ?? 0);
          const tgt = Number(target[key] ?? cur);
          const delta = tgt - cur;
          const gain = Math.abs(delta) > 120 ? 0.3 : 0.2;
          const value = cur + delta * gain;
          next[key] = Math.abs(delta) < 0.01 ? tgt : value;
        }
        return next;
      });
    }, 50);

    return () => {
      if (smoothTimerRef.current) {
        clearInterval(smoothTimerRef.current);
        smoothTimerRef.current = null;
      }
    };
  }, [isStreaming]);

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
