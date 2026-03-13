"use client";
import { useWebSocket } from "@/context/WebSocketContext";

export default function ControlStatus() {
  const {
    throttle, setThrottle,
    connected, aiModel,
    isStreaming, startStreaming, stopStreaming,
    emergencyStop,                              // ← triggers stop + analysis fetch
  } = useWebSocket();

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.7)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Section Title */}
      <h2
        style={{
          fontSize: "14px",
          fontFamily: "sans-serif",
          letterSpacing: "0.15em",
          color: "var(--text-secondary)",
          fontWeight: 700,
          marginBottom: "12px",
          textTransform: "uppercase",
        }}
      >
        FLIGHT CONTROLS
      </h2>

      {/* Main control area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* Vertical Throttle Slider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              position: "relative",
              width: "32px",
              height: "160px",               /* reduced to keep everything visible */
              background: "linear-gradient(180deg, #0f1829, #050a16)",
              borderRadius: "16px",
              border: "2px solid rgba(26, 52, 88, 0.4)",
              overflow: "hidden",
              boxShadow: "inset 0 4px 12px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                height: `${throttle}%`,
                background: "linear-gradient(0deg, var(--accent-cyan), rgba(0, 200, 255, 0.8))",
                borderRadius: "14px",
                transition: "height 0.2s ease-out",
                boxShadow: "0 0 16px rgba(0, 200, 255, 0.4)",
              }}
            />

            {/* Invisible input */}
            <input
              type="range"
              min="0"
              max="100"
              value={throttle}
              onChange={(e) => setThrottle(Number(e.target.value))}
              style={{
                position: "absolute",
                width: "160px",
                height: "32px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-90deg)",
                opacity: 0,
                cursor: "pointer",
                zIndex: 10,
              }}
            />

            {/* Thumb indicator */}
            <div
              style={{
                position: "absolute",
                bottom: `calc(${throttle}% - 8px)`,
                left: "50%",
                transform: "translateX(-50%)",
                width: "40px",
                height: "16px",
                background: "linear-gradient(90deg, #ffffff, #e0e7ff)",
                borderRadius: "8px",
                border: "2px solid var(--accent-cyan)",
                boxShadow: "0 0 12px rgba(0, 200, 255, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)",
                transition: "bottom 0.2s ease-out",
                zIndex: 5,
              }}
            />
          </div>

          {/* Throttle % */}
          <div
            style={{
              background: "rgba(14, 30, 56, 0.8)",
              border: "1px solid rgba(26, 52, 88, 0.6)",
              borderRadius: "8px",
              padding: "4px 16px",
              fontSize: "1rem",
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.05em",
              textAlign: "center",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            {throttle}%
          </div>
        </div>

        {/* Start / Stop toggle */}
        <button
          onClick={isStreaming ? stopStreaming : startStreaming}
          style={{
            width: "100%",
            padding: "10px 0",
            background: isStreaming
              ? "linear-gradient(145deg, var(--accent-red), #cc1f1f)"
              : "linear-gradient(145deg, var(--accent-green), #22c55e)",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: isStreaming
              ? "0 0 20px rgba(244,67,54,0.4), 0 4px 12px rgba(0,0,0,0.3)"
              : "0 0 20px rgba(34,197,94,0.4),  0 4px 12px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease",
          }}
        >
          {isStreaming ? "⏹ STOP SIMULATION" : "▶ START SIMULATION"}
        </button>

        {/* Emergency Stop — triggers analysis fetch */}
        <button
          onClick={emergencyStop}
          style={{
            width: "100%",
            padding: "9px 0",
            background: "linear-gradient(145deg, #7a0000, #550000)",
            border: "2px solid #f44336",
            borderRadius: "10px",
            color: "#ff6b6b",
            fontWeight: 900,
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: "0 0 24px rgba(244,67,54,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          ⬛ EMERGENCY STOP
        </button>
      </div>

      {/* Status rows */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
        <StatusRow
          icon=""
          label="Arduino Connected"
          value={connected ? "ONLINE" : "OFFLINE"}
          valueColor={connected ? "var(--accent-green)" : "#666"}
          iconColor={connected ? "var(--accent-green)" : "#666"}
        />
        <StatusRow
          icon=""
          label="Sensors OK"
          value={isStreaming ? "ACTIVE" : "IDLE"}
          valueColor={isStreaming ? "var(--accent-cyan)" : "#666"}
          iconColor={isStreaming ? "var(--accent-cyan)" : "#666"}
        />
        <StatusRow
          icon=""
          label="AI Model Active"
          value={aiModel ? "RUNNING" : "STOPPED"}
          valueColor={aiModel ? "var(--accent-blue)" : "#666"}
          iconColor={aiModel ? "var(--accent-blue)" : "#666"}
        />
      </div>
    </div>
  );
}

function StatusRow({ icon, label, value, valueColor, iconColor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 8px",
        background: "rgba(15, 24, 41, 0.6)",
        border: "1px solid rgba(26, 52, 88, 0.3)",
        borderRadius: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: iconColor, fontSize: "0.85rem" }}>{icon}</span>
        <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontFamily: "sans-serif" }}>{label}</span>
      </div>
      <span style={{ color: valueColor, fontWeight: 700, fontSize: "12px", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}