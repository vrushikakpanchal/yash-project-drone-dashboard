"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import DroneScene from "./DroneScene";
import { clamp } from "./imuMath";
import { useTelemetryMeta } from "./useTelemetryMeta";

function Chip({ label, valueColor = "#96d7ff" }) {
  return (
    <div
      style={{
        borderRadius: 999,
        border: "1px solid rgba(77,130,180,0.5)",
        background: "rgba(4,18,37,0.82)",
        padding: "4px 9px",
        fontSize: 12,
        color: valueColor,
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}

function AxisBlock({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "#d3e8f8", letterSpacing: "0.08em", lineHeight: 1.1 }}>{label}</div>
      <div
        style={{
          fontSize: "clamp(1.15rem,2vw,1.65rem)",
          color: "#4be2ff",
          fontWeight: 700,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ minWidth: 0, textAlign: "left" }}>
      <div style={{ fontSize: 10, color: "#d0e4f4", lineHeight: 1.1, letterSpacing: "0.06em" }}>{k}</div>
      <div
        style={{
          fontSize: 12,
          color: "#ecfaff",
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {v}
      </div>
    </div>
  );
}

export default function IMUDronePanel({ telemetry, rateHz = 2.0, height = "100%" }) {
  const { level, tone, live } = useTelemetryMeta(telemetry);
  const [focus, setFocus] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [btnHover, setBtnHover] = useState(false);

  const toneStyle = useMemo(() => {
    if (tone === "red") return { bg: "#2a0d0d", border: "#6f2727", title: "#ff9a9a", text: "#ffd7d7" };
    if (tone === "amber") return { bg: "#2a230d", border: "#6f5d27", title: "#ffd76b", text: "#fff0c8" };
    return { bg: "#0d2a14", border: "#1f6130", title: "#5fe07f", text: "#cef9d9" };
  }, [tone]);

  const insightLine = `${telemetry?.anomaly_status || "NORMAL"} | Sev ${Number(
    telemetry?.severity || 0
  ).toFixed(3)} (${level}) | Health ${Number(telemetry?.health || 0).toFixed(1)}% | RUL ${Number(
    telemetry?.rul || 0
  ).toFixed(1)}h | Fault: ${telemetry?.fault_type || "None"}`;

  return (
    <section
      style={{
        height,
        minHeight: 0,
        borderRadius: 10,
        border: "1px solid rgba(65,108,156,0.45)",
        background: "linear-gradient(180deg, rgba(7,18,40,0.86), rgba(6,16,36,0.92))",
        padding: 10,
        display: "grid",
        gridTemplateRows: "58fr 22fr 20fr",
        gap: 6,
        overflow: "hidden",
      }}
    >
      <div
        tabIndex={0}
        aria-label="Interactive 3D IMU drone scene. Left drag orbit, right drag pan, wheel zoom. Press reset view to restore camera."
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
          const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
          setPointer({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
        }}
        onPointerLeave={() => setPointer({ x: 0, y: 0 })}
        style={{
          position: "relative",
          borderRadius: 10,
          border: focus ? "1px solid rgba(99,205,255,0.8)" : "1px solid rgba(52,99,147,0.55)",
          overflow: "hidden",
          outline: "none",
          boxShadow: focus ? "0 0 0 2px rgba(99,205,255,0.28) inset" : "none",
        }}
      >
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2, display: "flex", gap: 6 }}>
          <Chip label={live ? "LIVE" : "OFFLINE"} valueColor={live ? "#7cf2ab" : "#b1b9c5"} />
          <Chip label={`RATE ${rateHz.toFixed(1)}Hz`} />
        </div>

        <button
          aria-label="Reset camera view"
          onClick={() => setResetNonce((n) => n + 1)}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          onFocus={() => setBtnHover(true)}
          onBlur={() => setBtnHover(false)}
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            zIndex: 2,
            borderRadius: 10,
            border: "1px solid rgba(84,149,196,0.55)",
            background: "rgba(4,20,40,0.82)",
            color: "#a4dbff",
            fontSize: 11,
            padding: "3px 7px",
            opacity: btnHover ? 1 : 0.62,
            transition: "opacity 160ms ease",
            cursor: "pointer",
            outline: btnHover ? "2px solid rgba(100,200,255,0.35)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          Reset
        </button>

        <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 45, near: 0.1, far: 40 }}>
          <DroneScene telemetry={telemetry} resetNonce={resetNonce} pointerParallax={pointer} />
        </Canvas>
      </div>

      <div
        style={{
          borderRadius: 10,
          border: "1px solid rgba(52,99,147,0.55)",
          background: "rgba(6,18,40,0.82)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "center",
          padding: "7px 10px",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <AxisBlock label="ROLL" value={`${Number(telemetry?.roll || 0).toFixed(1)}\u00B0`} />
        <AxisBlock label="PITCH" value={`${Number(telemetry?.pitch || 0).toFixed(1)}\u00B0`} />
        <AxisBlock label="YAW" value={`${(((Number(telemetry?.yaw || 0) % 360) + 360) % 360).toFixed(1)}\u00B0`} />
      </div>

      <div
        style={{
          borderRadius: 10,
          border: `1px solid ${toneStyle.border}`,
          background: toneStyle.bg,
          padding: "8px 9px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 12, color: toneStyle.title, fontWeight: 700, marginBottom: 4, lineHeight: 1.1, letterSpacing: "0.06em" }}>
          AI INSIGHTS
        </div>
        <div
          style={{
            fontSize: 11,
            color: toneStyle.text,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 0 6px rgba(0,0,0,0.25)",
            minHeight: 14,
          }}
        >
          {insightLine}
        </div>
        <div
          style={{
            marginTop: 6,
            borderTop: "1px solid rgba(93,142,186,0.25)",
            paddingTop: 5,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 6,
            minWidth: 0,
            alignItems: "start",
            flex: "0 0 auto",
          }}
        >
          <KV k="RPM" v={Math.round(Number(telemetry?.rpm || 0)).toString()} />
          <KV k="THRUST" v={`${Number(telemetry?.thrust || 0).toFixed(1)}g`} />
          <KV k="VIB" v={Number(telemetry?.vibration || 0).toFixed(3)} />
          <KV k="TEMP" v={`${Number(telemetry?.temperature || 0).toFixed(1)}C`} />
        </div>
      </div>
    </section>
  );
}
