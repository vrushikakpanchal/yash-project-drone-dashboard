"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString("en-US", { hour12: false }); }
  catch { return iso; }
}

const tooltipStyle = {
  contentStyle: {
    background: "rgba(15, 23, 42, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "sans-serif",
    padding: "6px 10px",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  labelStyle: { color: "#7fb3d3" },
  itemStyle:  { color: "#ccc" },
};

const axisProps = {
  tick:     { fontSize: 8, fill: "#5a8aaa" },
  tickLine: false,
  axisLine: false,
};

function ChartTitle({ children, color = "#7fb3d3" }) {
  return (
    <div style={{
      fontSize: "14px", fontFamily: "sans-serif", fontWeight: 700,
      letterSpacing: "0.1em", color,
      marginBottom: "2px", textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: "#0a1520",
      border: `1px solid ${color}44`,
      borderRadius: "5px",
      padding: "3px 8px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <span style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#5a8aaa", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{value}</span>
    </div>
  );
}

// ── Chart 1: Thrust vs RPM ────────────────────────────────────
function ThrustChart({ data }) {
  const fmt      = data.map((d) => ({ ...d, time: fmtTime(d.time) }));
  const maxThrust = Math.max(...data.map((d) => d.predicted_thrust), 0);
  const avgThrust = data.length
    ? Math.round(data.reduce((s, d) => s + d.predicted_thrust, 0) / data.length)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ChartTitle color="#4caf50">① Thrust vs RPM</ChartTitle>
        <div style={{ display: "flex", gap: "5px" }}>
          <StatBadge label="Peak"  value={`${maxThrust}g`} color="#4caf50" />
          <StatBadge label="Avg"   value={`${avgThrust}g`} color="#2196f3" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={88}>
        <LineChart data={fmt} margin={{ top: 2, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#0e2030" vertical={false} />
          <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
          <YAxis yAxisId="t" domain={[0, "auto"]} {...axisProps} tick={{ ...axisProps.tick, fill: "#4caf50" }} />
          <YAxis yAxisId="r" orientation="right" domain={[0, "auto"]} {...axisProps} tick={{ ...axisProps.tick, fill: "#2196f3" }} />
          <Tooltip {...tooltipStyle} />
          <Line yAxisId="t" type="monotone" dataKey="predicted_thrust" name="Thrust (g)" stroke="#4caf50" fill="#4caf50" fillOpacity={0.1} dot={false} strokeWidth={2.5} isAnimationActive={false} />
          <Line yAxisId="r" type="monotone" dataKey="rpm"              name="RPM"        stroke="#2196f3" fill="#2196f3" fillOpacity={0.1} dot={false} strokeWidth={2.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart 2: Anomaly Severity ─────────────────────────────────
function AnomalyChart({ data }) {
  const fmt          = data.map((d) => ({ ...d, time: fmtTime(d.time) }));
  const anomalyCount = data.filter((d) => d.anomaly_status === "ANOMALY").length;
  const anomalyPct   = data.length ? Math.round((anomalyCount / data.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ChartTitle color="#ff9800">② Anomaly Severity</ChartTitle>
        <div style={{ display: "flex", gap: "5px" }}>
          <StatBadge label="Anomalies" value={anomalyCount}     color="#f44336" />
          <StatBadge label="Rate"      value={`${anomalyPct}%`} color="#ff9800" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={88}>
        <LineChart data={fmt} margin={{ top: 2, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#0e2030" vertical={false} />
          <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
          <YAxis domain={[0, 1]} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <ReferenceLine
            y={0.5}
            stroke="#f4433666"
            strokeDasharray="4 3"
            label={{ value: "threshold", fill: "#f44336", fontSize: 7 }}
          />
          <Line
            type="monotone"
            dataKey="severity_score"
            name="Severity"
            stroke="#ff9800"
            fill="#ff9800"
            fillOpacity={0.1}
            strokeWidth={2.5}
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.anomaly_status === "ANOMALY") {
                return <circle key={`a-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#f44336" stroke="none" />;
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart 3: Health & RUL ─────────────────────────────────────
function HealthChart({ data }) {
  const fmt       = data.map((d) => ({ ...d, time: fmtTime(d.time) }));
  const lastHealth = data.length ? data[data.length - 1].health_score : 0;
  const lastRUL    = data.length ? data[data.length - 1].rul_hours    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ChartTitle color="#00bcd4">③ Motor Health & RUL</ChartTitle>
        <div style={{ display: "flex", gap: "5px" }}>
          <StatBadge label="Health" value={`${lastHealth}%`} color="#4caf50" />
          <StatBadge label="RUL"    value={`${lastRUL}h`}   color="#00bcd4" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={88}>
        <LineChart data={fmt} margin={{ top: 2, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#0e2030" vertical={false} />
          <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
          <YAxis yAxisId="h" domain={[0, 100]}   {...axisProps} tick={{ ...axisProps.tick, fill: "#4caf50" }} />
          <YAxis yAxisId="r" orientation="right" domain={[0, "auto"]} {...axisProps} tick={{ ...axisProps.tick, fill: "#00bcd4" }} />
          <Tooltip {...tooltipStyle} />
          <Line yAxisId="h" type="monotone" dataKey="health_score" name="Health %" stroke="#4caf50" fill="#4caf50" fillOpacity={0.1} dot={false} strokeWidth={2.5} isAnimationActive={false} />
          <Line yAxisId="r" type="monotone" dataKey="rul_hours"    name="RUL (hrs)" stroke="#00bcd4" fill="#00bcd4" fillOpacity={0.1} dot={false} strokeWidth={2.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Full charts layout ────────────────────────────────────────
function Charts({ thrust, anomaly, health, sessionInfo }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, overflowY: "auto",
      display: "flex", flexDirection: "column",
      gap: "10px", paddingRight: "4px",
    }}>
      {/* Session info bar */}
      {sessionInfo && (
        <div style={{
          display: "flex", gap: "8px", flexWrap: "wrap",
          padding: "5px 8px",
          background: "#0a1824", border: "1px solid #1a3050",
          borderRadius: "6px", fontSize: "12px", fontFamily: "sans-serif", color: "var(--text-secondary)",
        }}>
          <span>Duration: <strong style={{ color: "#fff", fontFamily: "monospace" }}>{sessionInfo.duration_seconds}s</strong></span>
          <span>Points:   <strong style={{ color: "#fff", fontFamily: "monospace" }}>{sessionInfo.data_points}</strong></span>
          <span>Started:  <strong style={{ color: "#fff", fontFamily: "monospace" }}>{new Date(sessionInfo.start_time).toLocaleTimeString()}</strong></span>
        </div>
      )}
      <ThrustChart  data={thrust}  />
      <AnomalyChart data={anomaly} />
      <HealthChart  data={health}  />
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────
export default function AnalysisCharts() {
  const { analysisData, isLoadingAnalysis, history } = useWebSocket();

  // ── Loading spinner ──────────────────────────────────────
  if (isLoadingAnalysis) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: "10px",
      }}>
        <div style={{
          width: "32px", height: "32px",
          border: "3px solid #1e3a5f",
          borderTop: "3px solid var(--accent-blue)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ fontSize: "12px", fontFamily: "sans-serif", color: "var(--text-secondary)" }}>
          Fetching analysis data...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Empty state — guide user to Emergency Stop ───────────
  if (!analysisData) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: "10px",
      }}>
        <div style={{ fontSize: "2rem" }}>🚨</div>
        <div style={{ fontSize: "14px", fontFamily: "sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>
          No Analysis Data Yet
        </div>
        <div style={{
          fontSize: "12px", fontFamily: "sans-serif", color: "var(--text-secondary)",
          textAlign: "center", maxWidth: "220px", lineHeight: 1.7,
        }}>
          Start a stream session, then press{" "}
          <span style={{
            color: "var(--accent-red)", fontWeight: 700,
            background: "rgba(244,67,54,0.12)",
            padding: "1px 6px", borderRadius: "4px",
            border: "1px solid rgba(244,67,54,0.3)",
          }}>
            ⬛ EMERGENCY STOP
          </span>{" "}
          to end the session and load the post-flight analysis charts here.
        </div>
      </div>
    );
  }

  // ── Mock data: derive from live history ──────────────────
  if (analysisData._mock) {
    const thrust_analysis = history.map((h) => ({
      time: new Date().toISOString(),
      predicted_thrust: h.thrust,
      rpm: h.rpm,
    }));
    const anomaly_analysis = history.map(() => ({
      time: new Date().toISOString(),
      severity_score: +(Math.random() * 0.4).toFixed(3),
      anomaly_status: Math.random() > 0.9 ? "ANOMALY" : "NORMAL",
    }));
    const health_analysis = history.map(() => ({
      time: new Date().toISOString(),
      health_score: +(85 + Math.random() * 10).toFixed(1),
      rul_hours:    +(200 + Math.random() * 50).toFixed(1),
    }));
    return <Charts thrust={thrust_analysis} anomaly={anomaly_analysis} health={health_analysis} sessionInfo={null} />;
  }

  // ── Real backend data ────────────────────────────────────
  return (
    <Charts
      thrust={analysisData.thrust_analysis   || []}
      anomaly={analysisData.anomaly_analysis || []}
      health={analysisData.health_analysis   || []}
      sessionInfo={analysisData.session_info}
    />
  );
}