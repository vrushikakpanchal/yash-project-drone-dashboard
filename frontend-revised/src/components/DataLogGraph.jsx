"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import AnalysisCharts from "@/components/AnalysisCharts";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useRef, useEffect, useState } from "react";

export default function DataLogGraph() {
  const { history, logs, analysisData, isLoadingAnalysis } = useWebSocket();
  const logRef = useRef(null);
  const [activeTab, setActiveTab] = useState("logs");

  // Scroll log to top on new entry
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logs]);

  // Auto-switch to analysis tab when analysis data arrives
  useEffect(() => {
    if (analysisData && !isLoadingAnalysis) {
      setActiveTab("charts");
    }
  }, [analysisData, isLoadingAnalysis]);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "10px 14px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ── Header row: title + tabs ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "var(--text-secondary)",
            fontWeight: 700,
          }}
        >
          DATA LOG & ANALYSIS
        </h2>

        {/* Tab buttons */}
        <div style={{ display: "flex", gap: "4px" }}>
          <TabButton
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
            label="LIVE DATA"
          />
          <TabButton
            active={activeTab === "charts"}
            onClick={() => setActiveTab("charts")}
            label="ANALYSIS"
            badge={!!analysisData}
            loading={isLoadingAnalysis}
          />
        </div>
      </div>

      {/* ── TAB: Live data (chart + log) ── */}
      {activeTab === "logs" && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            gap: "10px",
            overflow: "hidden",
          }}
        >
          {/* Recharts line graph */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#122030" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#5a8aaa", fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: "#1e3a5f" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="thrust"
                  domain={[0, 1200]}
                  tick={{ fill: "#4caf50", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Thrust (g)", angle: -90, position: "insideLeft", fill: "#4caf50", fontSize: 9, dx: 10 }}
                />
                <YAxis
                  yAxisId="rpm"
                  orientation="right"
                  domain={[0, 10000]}
                  tick={{ fill: "#2196f3", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "RPM", angle: 90, position: "insideRight", fill: "#2196f3", fontSize: 9, dx: -6 }}
                />
                <Tooltip
                  contentStyle={{ background: "#0a1220", border: "1px solid #1e3a5f", borderRadius: "6px", fontSize: "0.68rem", padding: "6px 10px" }}
                  labelStyle={{ color: "#7fb3d3", marginBottom: "2px" }}
                  itemStyle={{ color: "#ccc" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.68rem", paddingTop: "2px" }}
                  formatter={(v) => <span style={{ color: "#7fb3d3" }}>{v}</span>}
                />
                <Line yAxisId="thrust" type="monotone" dataKey="thrust" name="Thrust (g)" stroke="#4caf50" dot={false} strokeWidth={1.8} isAnimationActive={false} />
                <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="RPM" stroke="#2196f3" dot={false} strokeWidth={1.8} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Scrollable log panel */}
          <div
            ref={logRef}
            style={{
              width: "320px",
              flexShrink: 0,
              background: "#060d1a",
              border: "1px solid #152540",
              borderRadius: "6px",
              padding: "8px 10px",
              overflowY: "auto",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "0.6rem",
              color: "#6aafcc",
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 && (
              <div style={{ color: "#2a5a7a" }}>Waiting for stream...</div>
            )}
            {logs.map((entry, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid #0c1e30",
                  paddingBottom: "2px",
                  marginBottom: "2px",
                  color: i === 0 ? "#a0d4ee" : "#5a9ab8",
                }}
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Analysis charts ── */}
      {activeTab === "charts" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <AnalysisCharts />
        </div>
      )}
    </div>
  );
}

// ── Tab button sub-component ──────────────────────────────────
function TabButton({ active, onClick, label, badge, loading }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        padding: "4px 10px",
        fontSize: "0.62rem",
        fontWeight: 600,
        border: `1px solid ${active ? "var(--accent-blue)" : "var(--border)"}`,
        borderRadius: "4px",
        background: active ? "var(--accent-blue)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "" : ""}{label}
      {/* Green dot badge when analysis data is ready */}
      {badge && !active && (
        <span
          style={{
            position: "absolute",
            top: "-3px",
            right: "-3px",
            width: "7px",
            height: "7px",
            background: "var(--accent-green)",
            borderRadius: "50%",
            border: "1px solid var(--bg-card)",
          }}
        />
      )}
    </button>
  );
}