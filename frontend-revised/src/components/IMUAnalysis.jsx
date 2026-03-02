"use client";
import { useWebSocket } from "@/context/WebSocketContext";

export default function IMUAnalysis() {
  // sensorData.pitch/roll/yaw will be live when backend is connected
  const { sensorData } = useWebSocket();
  const { pitch = 2, roll = -1, yaw = 0 } = sensorData;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "14px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <h2 style={{ fontSize: "0.75rem", letterSpacing: "0.12em", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center" }}>
        IMU & AI ANALYSIS
      </h2>

      {/* 3D Orb (SVG simulation) */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IMUOrb pitch={pitch} roll={roll} yaw={yaw} />
        </div>

        {/* Axis Values */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem" }}>
          <AxisLabel axis="PITCH" value={pitch} color="#f44336" />
          <AxisLabel axis="ROLL" value={roll} color="#4caf50" />
          <AxisLabel axis="YAW" value={yaw} color="#2196f3" />
        </div>
      </div>

      {/* AI Insights */}
      <div style={{
        background: "#0a2a0a",
        border: "1px solid #1a4a1a",
        borderRadius: "8px",
        padding: "10px",
      }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: "6px", letterSpacing: "0.08em" }}>
          AI INSIGHTS
        </div>
        <div style={{ fontSize: "0.7rem", color: "#a0d0a0", lineHeight: 1.5 }}>
          Efficiency: 85% | Stable Operation | Predicted Max Thrust: 1200g
        </div>
      </div>
    </div>
  );
}

function AxisLabel({ axis, value, color }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span style={{ color, fontWeight: 700, width: "40px", fontSize: "0.7rem" }}>{axis}:</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}°</span>
    </div>
  );
}

function IMUOrb({ pitch, roll, yaw }) {
  const cx = 75, cy = 75, r = 55;
  // Rotate axes slightly based on IMU values for a dynamic feel
  const px = pitch * 0.5;
  const ry = roll * 0.5;

  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e3a5f" strokeWidth="1" />
      {/* Equator ellipse */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3 + ry} fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4 3" />
      {/* Meridian ellipse */}
      <ellipse cx={cx} cy={cy} rx={r * 0.3 + px} ry={r} fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4 3" />

      {/* X axis (red) */}
      <line x1={cx - r + 5} y1={cy + 10} x2={cx + r - 5} y2={cy - 10} stroke="#f44336" strokeWidth="2" />
      <text x={cx - r} y={cy + 20} fill="#f44336" fontSize="10" fontWeight="bold">X</text>

      {/* Y axis (green) */}
      <line x1={cx + 5} y1={cy + r - 5} x2={cx + 30} y2={cy - r + 15} stroke="#4caf50" strokeWidth="2" />
      <text x={cx + 30} y={cy - r + 10} fill="#4caf50" fontSize="10" fontWeight="bold">Y</text>

      {/* Z axis (blue) */}
      <line x1={cx} y1={cy + r - 5} x2={cx} y2={cy - r + 5} stroke="#2196f3" strokeWidth="2" />
      <text x={cx + 5} y={cy - r + 5} fill="#2196f3" fontSize="10" fontWeight="bold">Z</text>

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill="#2196f3" opacity="0.7" />
    </svg>
  );
}