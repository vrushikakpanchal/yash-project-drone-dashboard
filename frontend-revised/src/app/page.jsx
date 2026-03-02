"use client";

import React from "react";

import dynamic from "next/dynamic";

const ControlStatus = dynamic(
  () => import("@/components/ControlStatus"),
  { ssr: false }
);

const RealTimeData = dynamic(
  () => import("@/components/RealTimeData"),
  { ssr: false }
);

const DataLogGraph = dynamic(
  () => import("@/components/DataLogGraph"),
  { ssr: false }
);

const IMUAnalysis = dynamic(
  () => import("@/components/IMUAnalysis"),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "10px 12px",
        gap: "8px",
        background: "var(--bg-primary)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── TITLE ── */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "1.15rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "0.06em",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        AI-Enabled Drone Thrust Measurement System
      </h1>

      {/* ── MAIN LAYOUT: Full-height sidebar + content area ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: "8px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Full-height ControlStatus sidebar */}
        <ControlStatus />
        
        {/* Main content area with 3 components */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Top row: RealTimeData and IMUAnalysis */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 260px",
              gap: "8px",
              height: "320px",
              flexShrink: 0,
              minHeight: "320px",
              maxHeight: "320px",
            }}
          >
            <RealTimeData />
            <IMUAnalysis />
          </div>
          
          {/* Bottom: DataLogGraph with fixed height constraints */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: "calc(100% - 328px)",
              overflow: "hidden",
            }}
          >
            <DataLogGraph />
          </div>
        </div>
      </div>
    </div>
  );
}