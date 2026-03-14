"use client";
import { useWebSocket } from "@/context/WebSocketContext";
import { useMemo, useRef, useState } from "react";

export default function IMUAnalysis() {
  const { sensorData, connected, isStreaming } = useWebSocket();
  const {
    pitch = 2,
    roll = -1,
    yaw = 0,
    rpm = 0,
    thrust = 0,
    vibration = 0,
    temperature = 0,
    anomaly_status = "NORMAL",
    severity = 0,
    health = 100,
    rul = 0,
    fault_type = "Normal",
  } = sensorData;

  const sceneRef = useRef(null);
  const [cameraTilt, setCameraTilt] = useState({ x: 0, y: 0, active: false });

  const imu = useMemo(
    () => ({
      pitch: Number(pitch) || 0,
      roll: Number(roll) || 0,
      yaw: Number(yaw) || 0,
    }),
    [pitch, roll, yaw]
  );

  const imuMode = useMemo(() => {
    if (!connected) return "OFFLINE";
    if (!isStreaming) return "IDLE";
    return "IMU LIVE";
  }, [connected, isStreaming]);

  const streamRateHz = 2.0;
  const severityLevel =
    Number(severity) >= 0.2 ? "HIGH" : Number(severity) >= 0.08 ? "MED" : "LOW";
  const statusColor = anomaly_status === "ANOMALY" ? "#ff8a80" : "#7ef2b0";

  const handlePointerMove = (e) => {
    const el = sceneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const tiltY = clamp(nx * 8, -8, 8);
    const tiltX = clamp(-ny * 7, -7, 7);
    setCameraTilt({ x: tiltX, y: tiltY, active: true });
  };

  const handlePointerLeave = () => {
    setCameraTilt({ x: 0, y: 0, active: false });
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.7)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "12px 14px",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflow: "hidden",
        boxSizing: "border-box",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <h2
        style={{
          fontSize: "14px",
          fontFamily: "sans-serif",
          letterSpacing: "0.12em",
          color: "var(--text-secondary)",
          fontWeight: 700,
          textAlign: "center",
          margin: 0,
          marginBottom: "2px",
          flex: "0 0 auto",
        }}
      >
        IMU & AI ANALYSIS
      </h2>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "6px", overflow: "hidden" }}>
        <div
          ref={sceneRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            position: "relative",
            flex: "1 1 50%",
            minHeight: "95px",
            borderRadius: "12px",
            border: "1px solid rgba(63, 122, 170, 0.35)",
            background:
              "radial-gradient(100% 80% at 50% 35%, rgba(15, 44, 82, 0.55) 0%, rgba(5, 13, 28, 0.95) 80%)",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "5px", zIndex: 2 }}>
            <MiniChip label="STREAM" value={connected ? "ONLINE" : "OFFLINE"} valueColor={connected ? "#7ef2b0" : "#9ca3af"} />
            <MiniChip label="RATE" value={`${streamRateHz.toFixed(1)}Hz`} />
            <MiniChip label="MODE" value={isStreaming ? "LIVE" : "SIM"} />
          </div>

          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "9px",
              fontFamily: "monospace",
              color: connected ? "#5dd9ff" : "#637d9b",
              background: "rgba(2, 12, 28, 0.65)",
              border: "1px solid rgba(59, 118, 170, 0.4)",
              borderRadius: "999px",
              padding: "2px 7px",
              letterSpacing: "0.08em",
              zIndex: 2,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: connected ? "#39d98a" : "#8a8a8a",
                boxShadow: connected ? "0 0 8px #39d98a" : "none",
              }}
            />
            {imuMode}
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `perspective(950px) rotateX(${cameraTilt.x}deg) rotateY(${cameraTilt.y}deg)`,
              transformStyle: "preserve-3d",
              transition: cameraTilt.active ? "transform 90ms linear" : "transform 260ms ease-out",
              willChange: "transform",
            }}
          >
            <IMUDroneScene
              pitch={imu.pitch}
              roll={imu.roll}
              yaw={imu.yaw}
              active={connected && isStreaming}
              cameraTilt={cameraTilt}
            />
          </div>
        </div>

        <div
          style={{
            borderRadius: "10px",
            border: "1px solid rgba(47, 98, 150, 0.35)",
            background: "rgba(2, 13, 32, 0.75)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "6px 6px",
            gap: "4px",
            flex: "0 0 auto",
          }}
        >
          <TelemetryCell label="ROLL" value={imu.roll} />
          <TelemetryCell label="PITCH" value={imu.pitch} />
          <TelemetryCell label="YAW" value={((imu.yaw % 360) + 360) % 360} />
        </div>

        <div
          style={{
            borderRadius: "8px",
            border: "1px solid rgba(43, 86, 132, 0.35)",
            background: "rgba(4, 16, 36, 0.72)",
            padding: "5px 7px",
            fontSize: "9px",
            fontFamily: "monospace",
            color: "#7fc9ff",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3px 8px",
            flex: "0 0 auto",
          }}
        >
          <MetricText label="RPM" value={Number(rpm).toFixed(0)} />
          <MetricText label="THRUST" value={`${Number(thrust).toFixed(1)}g`} />
          <MetricText label="VIB" value={Number(vibration).toFixed(3)} />
          <MetricText label="TEMP" value={`${Number(temperature).toFixed(1)}C`} />
        </div>
      </div>

      <div
        style={{
          background: "#0a2a0a",
          border: "1px solid #1a4a1a",
          borderRadius: "8px",
          padding: "6px 8px",
          flex: "0 0 auto",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontFamily: "sans-serif",
            fontWeight: 700,
            color: "var(--accent-green)",
            marginBottom: "4px",
            letterSpacing: "0.08em",
          }}
        >
          AI INSIGHTS
        </div>
        <div style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#a0d0a0", lineHeight: 1.25 }}>
          <span style={{ color: statusColor, fontWeight: 700 }}>{anomaly_status || "NORMAL"}</span>
          {" | "}
          Sev: {Number(severity).toFixed(3)} ({severityLevel})
          {" | "}
          Health: {Number(health).toFixed(1)}%
          {" | "}
          RUL: {Number(rul).toFixed(1)}h
          {" | "}
          Fault: {fault_type || "Normal"}
        </div>
      </div>
    </div>
  );
}

function MiniChip({ label, value, valueColor = "#8fd8ff" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: "4px",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: "999px",
        border: "1px solid rgba(58, 118, 168, 0.45)",
        background: "rgba(3, 16, 34, 0.72)",
        fontFamily: "monospace",
        fontSize: "8px",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "#6e8fab" }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function TelemetryCell({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: "10px", fontFamily: "sans-serif", color: "#7ca8cc", letterSpacing: "0.09em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "clamp(1rem, 1.5vw, 1.45rem)",
          fontFamily: "monospace",
          color: "#44d5ff",
          fontWeight: 700,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          letterSpacing: "0.01em",
        }}
      >
        {Number(value).toFixed(1)}°
      </div>
    </div>
  );
}

function MetricText({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", whiteSpace: "nowrap" }}>
      <span style={{ color: "#6f9cc5" }}>{label}:</span>
      <span style={{ color: "#b8ecff", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function IMUDroneScene({ pitch, roll, yaw, active, cameraTilt }) {
  const clampedPitch = Math.max(-25, Math.min(25, pitch));
  const clampedRoll = Math.max(-25, Math.min(25, roll));
  const yawNorm = ((yaw % 360) + 360) % 360;
  const droneY = 94 - clampedPitch * 0.4;
  const droneTilt = -clampedRoll * 0.9;
  const horizonY = 112 + clampedPitch * 0.3;
  const camX = cameraTilt?.x || 0;
  const camY = cameraTilt?.y || 0;

  return (
    <svg width="100%" height="100%" viewBox="0 0 520 270" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="horizonLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(57, 171, 232, 0)" />
          <stop offset="50%" stopColor="rgba(57, 171, 232, 0.45)" />
          <stop offset="100%" stopColor="rgba(57, 171, 232, 0)" />
        </linearGradient>
        <radialGradient id="skyGlow" cx="50%" cy="10%" r="90%">
          <stop offset="0%" stopColor="rgba(45, 144, 235, 0.22)" />
          <stop offset="100%" stopColor="rgba(4, 12, 28, 0)" />
        </radialGradient>
        <linearGradient id="floorFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(10, 26, 52, 0.4)" />
          <stop offset="100%" stopColor="rgba(2, 9, 20, 0.9)" />
        </linearGradient>
        <radialGradient id="engineGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(35, 226, 255, 0.65)" />
          <stop offset="100%" stopColor="rgba(35, 226, 255, 0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="520" height="270" fill="url(#skyGlow)" />
      <path d={`M 0 ${horizonY} L 520 ${horizonY} L 520 270 L 0 270 Z`} fill="url(#floorFade)" />

      <g opacity="0.55" transform={`translate(${camY * 1.2} ${camX * 0.6})`}>
        <line x1="0" y1={horizonY} x2="520" y2={horizonY} stroke="url(#horizonLine)" strokeWidth="2" />
        {[...Array(9)].map((_, i) => (
          <line
            key={`h-${i}`}
            x1={20 + i * 55}
            y1={horizonY + 2}
            x2={10 + i * 62}
            y2="270"
            stroke="rgba(27, 131, 185, 0.22)"
            strokeWidth="1"
          />
        ))}
        {[...Array(7)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1="0"
            y1={horizonY + 12 + i * 18}
            x2="520"
            y2={horizonY + 40 + i * 13}
            stroke="rgba(27, 131, 185, 0.18)"
            strokeWidth="1"
          />
        ))}
      </g>

      <g transform={`translate(${260 + camY * 2.2} ${droneY - camX * 1.4}) rotate(${droneTilt}) scale(1.32)`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -2; 0 0"
            dur={active ? "2.8s" : "4.2s"}
            repeatCount="indefinite"
          />
          <ellipse cx="0" cy="24" rx="126" ry="20" fill="rgba(0, 0, 0, 0.4)" />

          <rect x="-74" y="-10" width="148" height="20" rx="4" fill="#070c16" />
          <rect x="-112" y="-4" width="42" height="8" rx="2" fill="#050a12" />
          <rect x="70" y="-4" width="42" height="8" rx="2" fill="#050a12" />
          <rect x="-30" y="-15" width="60" height="11" rx="2" fill="#0e1727" />
          <rect x="-24" y="-7" width="48" height="4" rx="1" fill="rgba(67, 205, 255, 0.22)" />

          <g>
            <ellipse cx="-92" cy="-20" rx="26" ry="4.5" fill="rgba(44, 202, 255, 0.25)" />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 -92 -20`}
                to={`360 -92 -20`}
                dur={active ? "0.55s" : "2.2s"}
                repeatCount="indefinite"
              />
              <line x1="-110" y1="-20" x2="-74" y2="-20" stroke="rgba(62,220,255,0.45)" strokeWidth="1" />
              <line x1="-92" y1="-29" x2="-92" y2="-11" stroke="rgba(62,220,255,0.45)" strokeWidth="1" />
            </g>
            <rect x="-99" y="-19" width="14" height="14" rx="1.5" fill="#0f1b29" />
            <ellipse cx="-92" cy="-7" rx="23" ry="7" fill="url(#engineGlow)" />
          </g>

          <g>
            <ellipse cx="0" cy="-29" rx="34" ry="5.5" fill="rgba(44, 202, 255, 0.28)" />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 0 -29`}
                to={`360 0 -29`}
                dur={active ? "0.48s" : "2.0s"}
                repeatCount="indefinite"
              />
              <line x1="-22" y1="-29" x2="22" y2="-29" stroke="rgba(62,220,255,0.5)" strokeWidth="1" />
              <line x1="0" y1="-40" x2="0" y2="-18" stroke="rgba(62,220,255,0.5)" strokeWidth="1" />
            </g>
            <rect x="-7" y="-26" width="14" height="20" rx="2" fill="#102336" />
            <ellipse cx="0" cy="-7" rx="29" ry="8" fill="url(#engineGlow)" />
          </g>

          <g>
            <ellipse cx="92" cy="-20" rx="26" ry="4.5" fill="rgba(44, 202, 255, 0.25)" />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 92 -20`}
                to={`360 92 -20`}
                dur={active ? "0.55s" : "2.2s"}
                repeatCount="indefinite"
              />
              <line x1="74" y1="-20" x2="110" y2="-20" stroke="rgba(62,220,255,0.45)" strokeWidth="1" />
              <line x1="92" y1="-29" x2="92" y2="-11" stroke="rgba(62,220,255,0.45)" strokeWidth="1" />
            </g>
            <rect x="85" y="-19" width="14" height="14" rx="1.5" fill="#0f1b29" />
            <ellipse cx="92" cy="-7" rx="23" ry="7" fill="url(#engineGlow)" />
          </g>
        </g>
      </g>

      <g transform={`translate(${468 - camY * 0.8} ${34 - camX * 0.6}) rotate(${yawNorm})`}>
        <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(67, 135, 180, 0.35)" strokeWidth="1" />
        <path d="M 0 -14 L 4 0 L 0 14 L -4 0 Z" fill="rgba(62, 220, 255, 0.7)" />
      </g>
    </svg>
  );
}
