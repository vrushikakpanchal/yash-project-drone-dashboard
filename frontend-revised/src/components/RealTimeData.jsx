"use client";
import { useWebSocket } from "@/context/WebSocketContext";

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "12px 16px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxSizing: "border-box",
};

// ── THRUST ARC GAUGE ─────────────────────────────────────────
function ThrustGauge({ value, max = 1200 }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const cx = 85, cy = 88, r = 68;
  const startDeg = -220;
  const sweepDeg = 260;

  const toRad = (d) => (d * Math.PI) / 180;

  const arcPath = (startD, endD, radius) => {
    const sx = cx + radius * Math.cos(toRad(startD));
    const sy = cy + radius * Math.sin(toRad(startD));
    const ex = cx + radius * Math.cos(toRad(endD));
    const ey = cy + radius * Math.sin(toRad(endD));
    const large = endD - startD > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey}`;
  };

  const fillEnd = startDeg + sweepDeg * pct;

  return (
    <div style={{ position: "relative", width: "170px", height: "170px", flexShrink: 0 }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        {/* Track */}
        <path
          d={arcPath(startDeg, startDeg + sweepDeg, r)}
          fill="none"
          stroke="#162a44"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Fill */}
        {pct > 0 && (
          <path
            d={arcPath(startDeg, fillEnd, r)}
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="13"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Peak Hold Badge */}
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#5a3c00",
          border: "1px solid #cc8800",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "0.58rem",
          color: "#ffaa00",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
        }}
      >
        ▲ Peak Hold
      </div>

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -44%)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
          THRUST:
        </div>
        <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.05 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>g</div>
      </div>
    </div>
  );
}

// ── RPM SPEEDOMETER ──────────────────────────────────────────
function RPMGauge({ value, max = 10000 }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const cx = 82, cy = 82, r = 62;
  const startDeg = -220;
  const sweepDeg = 260;
  const toRad = (d) => (d * Math.PI) / 180;

  const arcPath = (startD, endD, radius) => {
    const sx = cx + radius * Math.cos(toRad(startD));
    const sy = cy + radius * Math.sin(toRad(startD));
    const ex = cx + radius * Math.cos(toRad(endD));
    const ey = cy + radius * Math.sin(toRad(endD));
    const large = endD - startD > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey}`;
  };

  const needleDeg = startDeg + sweepDeg * pct;
  const needleTip = {
    x: cx + (r - 12) * Math.cos(toRad(needleDeg)),
    y: cy + (r - 12) * Math.sin(toRad(needleDeg)),
  };

  // Scale labels: 0,100,...,1000 mapped evenly
  const scaleLabels = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  return (
    <div style={{ position: "relative", width: "164px", height: "164px", flexShrink: 0 }}>
      <svg width="164" height="164" viewBox="0 0 164 164">
        {/* Green zone track */}
        <path
          d={arcPath(startDeg, startDeg + sweepDeg * 0.72, r)}
          fill="none"
          stroke="#0d2e0d"
          strokeWidth="11"
        />
        {/* Red zone track */}
        <path
          d={arcPath(startDeg + sweepDeg * 0.72, startDeg + sweepDeg, r)}
          fill="none"
          stroke="#2e0d0d"
          strokeWidth="11"
        />
        {/* Active green fill */}
        {pct > 0 && pct <= 0.72 && (
          <path
            d={arcPath(startDeg, needleDeg, r)}
            fill="none"
            stroke="#4caf50"
            strokeWidth="11"
          />
        )}
        {/* Active green + red fill */}
        {pct > 0.72 && (
          <>
            <path
              d={arcPath(startDeg, startDeg + sweepDeg * 0.72, r)}
              fill="none"
              stroke="#4caf50"
              strokeWidth="11"
            />
            <path
              d={arcPath(startDeg + sweepDeg * 0.72, needleDeg, r)}
              fill="none"
              stroke="#f44336"
              strokeWidth="11"
            />
          </>
        )}

        {/* Scale tick labels */}
        {scaleLabels.map((label, i) => {
          const ang = startDeg + (sweepDeg * i) / (scaleLabels.length - 1);
          const tx = cx + (r + 14) * Math.cos(toRad(ang));
          const ty = cy + (r + 14) * Math.sin(toRad(ang));
          return (
            <text
              key={label}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#5a8aaa"
              fontSize="7"
              fontFamily="monospace"
            >
              {label}
            </text>
          );
        })}

        {/* RPM label inside top */}
        <text x={cx} y={cy - r + 16} textAnchor="middle" fill="#7fb3d3" fontSize="9" fontFamily="sans-serif">
          RPM:
        </text>

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#ff3333"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="5.5" fill="#1a1a2e" stroke="#444" strokeWidth="1.5" />
      </svg>

      {/* RPM numeric value */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ── ELECTRIC READING CARD ────────────────────────────────────
function ElectricCard({ label, value, unit, batteryPct }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "6px 4px",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: "0.62rem",
          color: "var(--text-secondary)",
          letterSpacing: "0.1em",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}:
      </div>

      {/* Value row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Battery badge for voltage */}
        {batteryPct !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              background: "#0d2a0d",
              border: "1px solid #1e5a1e",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "0.62rem",
              color: "var(--accent-green)",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            🔋 {batteryPct}%
          </span>
        )}
        <span
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            lineHeight: 1,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function RealTimeData() {
  const { sensorData } = useWebSocket();
  const { thrust, rpm, voltage, current, power } = sensorData;

  return (
    <div style={cardStyle}>
      <h2
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          color: "var(--text-secondary)",
          fontWeight: 700,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        REAL-TIME DATA
      </h2>

      {/* ── Gauges Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          flex: 1,
          minHeight: 0,
        }}
      >
        <ThrustGauge value={thrust} />
        <RPMGauge value={rpm} />
      </div>

      {/* ── Electrical Readings ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0px",
          flexShrink: 0,
        }}
      >
        <ElectricCard label="Voltage" value={voltage.toFixed(1)} unit="V" batteryPct={76} />
        <ElectricCard label="Current" value={current.toFixed(1)} unit="A" />
        <ElectricCard label="Power" value={power.toFixed(1)} unit="W" />
      </div>
    </div>
  );
}