"use client";
import { useWebSocket } from "@/context/WebSocketContext";

const cardStyle = {
  background: "rgba(15, 23, 42, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  padding: "16px 18px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

// ── THRUST ARC GAUGE ─────────────────────────────────────────
function ThrustGauge({ value, max = 1200 }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const displayValue = Number.isFinite(value) ? Number(value).toFixed(1) : "0.0";
  const cx = 85, cy = 85, r = 68;
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
  const needleDeg = startDeg + sweepDeg * pct;
  const needleLen = r - 12;
  const needleTip = {
    x: cx + needleLen * Math.cos(toRad(needleDeg)),
    y: cy + needleLen * Math.sin(toRad(needleDeg)),
  };
  const baseWidth = 5;
  const baseLeft = {
    x: cx - baseWidth * Math.sin(toRad(needleDeg)),
    y: cy + baseWidth * Math.cos(toRad(needleDeg)),
  };
  const baseRight = {
    x: cx + baseWidth * Math.sin(toRad(needleDeg)),
    y: cy - baseWidth * Math.cos(toRad(needleDeg)),
  };
  const needlePoints = `${baseLeft.x},${baseLeft.y} ${needleTip.x},${needleTip.y} ${baseRight.x},${baseRight.y}`;

  const scaleLabels = [100, 200, 300, 400, 500, 700, 800, 900, 1000, 1100, 1200];
  const tickValues = [];
  for (let v = 100; v <= 1200; v += 50) {
    if (!scaleLabels.includes(v)) tickValues.push(v);
  }

  const peakHoldTopStyle = {
    position: "absolute",
    top: "6px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#e6a800",
    borderRadius: "6px",
    padding: "2px 8px",
    fontSize: "0.58rem",
    color: "#1a1a1a",
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  };
  const peakHoldBottomStyle = {
    position: "absolute",
    bottom: "6px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2a2f38",
    borderRadius: "6px",
    padding: "2px 8px",
    fontSize: "0.58rem",
    color: "#e4f0fb",
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  };

  return (
    <div style={{ position: "relative", width: "170px", height: "170px", flexShrink: 0 }}>
      <svg width="170" height="170" viewBox="0 0 170 170" shapeRendering="geometricPrecision">
        <defs>
          <linearGradient id="thrustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a5a8a" />
            <stop offset="100%" stopColor="#4dd0e1" />
          </linearGradient>
        </defs>

        {/* Track – faint light grey arc */}
        <path
          d={arcPath(startDeg, startDeg + sweepDeg, r)}
          fill="none"
          stroke="#5a6c7a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Minor tick marks */}
        {tickValues.map((v) => {
          const ang = startDeg + sweepDeg * (v / max);
          const outerR = r + 4;
          const innerR = r - 2;
          const ox = cx + outerR * Math.cos(toRad(ang));
          const oy = cy + outerR * Math.sin(toRad(ang));
          const ix = cx + innerR * Math.cos(toRad(ang));
          const iy = cy + innerR * Math.sin(toRad(ang));
          return (
            <line key={v} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#5a6c7a" strokeWidth="1" strokeLinecap="round" />
          );
        })}

        {/* Fill – blue gradient, slightly thicker */}
        {pct > 0 && (
          <path
            d={arcPath(startDeg, fillEnd, r)}
            fill="none"
            stroke="url(#thrustGradient)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}

        {/* Scale labels */}
        {scaleLabels.map((label) => {
          const ang = startDeg + sweepDeg * (label / max);
          const tx = cx + (r + 14) * Math.cos(toRad(ang));
          const ty = cy + (r + 14) * Math.sin(toRad(ang));
          return (
            <text
              key={label}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#9aadb8"
              fontSize="7"
              fontFamily="sans-serif"
              fontWeight="600"
              letterSpacing="0.03em"
              fontVariant="tabular-nums"
              transform={`rotate(${ang + 90} ${tx} ${ty})`}
            >
              {label}
            </text>
          );
        })}

        {/* Needle – triangular, luminous blue-white */}
        <polygon
          points={needlePoints}
          fill="#a8d4f0"
          stroke="#b8e0ff"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="5.5" fill="#8bc9f0" stroke="#a8d4f0" strokeWidth="1" />
      </svg>

      {/* Top Peak Hold */}
      <div style={peakHoldTopStyle}>
        ▲ Peak Hold
      </div>

      {/* Bottom Peak Hold */}
      <div style={peakHoldBottomStyle}>
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
        <div style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#fff", letterSpacing: "0.1em" }}>
          THRUST:
        </div>
        <div style={{ fontSize: "2.2rem", fontFamily: "monospace", fontWeight: 700, color: "#fff", lineHeight: 1.05 }}>
          {displayValue}
        </div>
        <div style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#fff" }}>g</div>
      </div>
    </div>
  );
}

// ── RPM SPEEDOMETER ──────────────────────────────────────────
function RPMGauge({ value, max = 8000 }) {
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
  const needleLen = r - 12;
  const needleTip = {
    x: cx + needleLen * Math.cos(toRad(needleDeg)),
    y: cy + needleLen * Math.sin(toRad(needleDeg)),
  };
  const baseWidth = 5;
  const baseLeft = {
    x: cx - baseWidth * Math.sin(toRad(needleDeg)),
    y: cy + baseWidth * Math.cos(toRad(needleDeg)),
  };
  const baseRight = {
    x: cx + baseWidth * Math.sin(toRad(needleDeg)),
    y: cy - baseWidth * Math.cos(toRad(needleDeg)),
  };
  const needlePoints = `${baseLeft.x},${baseLeft.y} ${needleTip.x},${needleTip.y} ${baseRight.x},${baseRight.y}`;

  // Scale labels: 0, 1000, ..., 8000
  const scaleLabels = [];
  for (let v = 0; v <= max; v += 1000) scaleLabels.push(v);
  // Minor tick values between each 1000 step
  const tickValues = [];
  for (let v = 500; v < max; v += 500) tickValues.push(v);

  // Zone boundaries: Green 0–60%, Yellow 60–80%, Red 80–100%
  const greenEnd = 0.6;
  const yellowEnd = 0.8;

  return (
    <div style={{ position: "relative", width: "164px", height: "164px", flexShrink: 0 }}>
      <svg width="164" height="164" viewBox="0 0 164 164" shapeRendering="geometricPrecision">
        {/* Green zone track (0–60%) */}
        <path
          d={arcPath(startDeg, startDeg + sweepDeg * greenEnd, r)}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Yellow zone track (60–80%) */}
        <path
          d={arcPath(startDeg + sweepDeg * greenEnd, startDeg + sweepDeg * yellowEnd, r)}
          fill="none"
          stroke="#FFC107"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Red zone track (80–100%) */}
        <path
          d={arcPath(startDeg + sweepDeg * yellowEnd, startDeg + sweepDeg, r)}
          fill="none"
          stroke="#F44336"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Active fill – green only */}
        {pct > 0 && pct <= greenEnd && (
          <path
            d={arcPath(startDeg, needleDeg, r)}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="11"
            strokeLinecap="round"
          />
        )}
        {/* Active fill – green + yellow */}
        {pct > greenEnd && pct <= yellowEnd && (
          <>
            <path
              d={arcPath(startDeg, startDeg + sweepDeg * greenEnd, r)}
              fill="none"
              stroke="#4CAF50"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d={arcPath(startDeg + sweepDeg * greenEnd, needleDeg, r)}
              fill="none"
              stroke="#FFC107"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </>
        )}
        {/* Active fill – green + yellow + red */}
        {pct > yellowEnd && (
          <>
            <path
              d={arcPath(startDeg, startDeg + sweepDeg * greenEnd, r)}
              fill="none"
              stroke="#4CAF50"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d={arcPath(startDeg + sweepDeg * greenEnd, startDeg + sweepDeg * yellowEnd, r)}
              fill="none"
              stroke="#FFC107"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d={arcPath(startDeg + sweepDeg * yellowEnd, needleDeg, r)}
              fill="none"
              stroke="#F44336"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Minor tick marks */}
        {tickValues.map((v) => {
          const ang = startDeg + (sweepDeg * v) / max;
          const outerR = r + 4;
          const innerR = r - 2;
          const ix = cx + innerR * Math.cos(toRad(ang));
          const iy = cy + innerR * Math.sin(toRad(ang));
          const ox = cx + outerR * Math.cos(toRad(ang));
          const oy = cy + outerR * Math.sin(toRad(ang));
          return (
            <line key={v} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#b8c5d0" strokeWidth="1" strokeLinecap="round" />
          );
        })}

        {/* Scale labels – light grey/white */}
        {scaleLabels.map((label, i) => {
          const ang = startDeg + (sweepDeg * label) / max;
          const tx = cx + (r + 14) * Math.cos(toRad(ang));
          const ty = cy + (r + 14) * Math.sin(toRad(ang));
          return (
            <text
              key={label}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#b8c5d0"
              fontSize="7"
              fontFamily="sans-serif"
              fontWeight="600"
              letterSpacing="0.03em"
              fontVariant="tabular-nums"
              transform={`rotate(${ang + 90} ${tx} ${ty})`}
            >
              {label}
            </text>
          );
        })}

        {/* Needle – triangular, light grey/white (#E0E0E0) */}
        <polygon
          points={needlePoints}
          fill="#E0E0E0"
          stroke="#f0f0f0"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Center hub – light blue-grey (#8FADC7) */}
        <circle cx={cx} cy={cy} r="5.5" fill="#8FADC7" stroke="#a0b8d0" strokeWidth="1" />
      </svg>

      {/* Center readout: RPM: (white) + value (green) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: "12px", fontFamily: "sans-serif", color: "#FFFFFF", letterSpacing: "0.08em", marginBottom: "2px" }}>RPM:</div>
        <div
          style={{
            fontSize: "1.25rem",
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "0.04em",
          }}
        >
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
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
          fontSize: "12px",
          fontFamily: "sans-serif",
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
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#fff",
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
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontFamily: "sans-serif",
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
          fontSize: "14px",
          fontFamily: "sans-serif",
          letterSpacing: "0.12em",
          color: "var(--text-secondary)",
          fontWeight: 700,
          textAlign: "center",
          flexShrink: 0,
          margin: 0,
          marginBottom: "2px",
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
