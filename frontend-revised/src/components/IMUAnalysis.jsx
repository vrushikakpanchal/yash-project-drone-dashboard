"use client";

import { useWebSocket } from "@/context/WebSocketContext";
import IMUDronePanel from "@/components/imu3d/IMUDronePanel";
import { useEffect, useState } from "react";

export default function IMUAnalysis() {
  const { sensorData, connected, isStreaming, throttle } = useWebSocket();
  const [simIMU, setSimIMU] = useState({ roll: 0, pitch: 0, yaw: 0 });
  const rawRoll = Number(sensorData?.roll ?? 0);
  const rawPitch = Number(sensorData?.pitch ?? 0);
  const rawYaw = Number(sensorData?.yaw ?? 0);
  const hasRealIMU = Math.abs(rawRoll) > 0.02 || Math.abs(rawPitch) > 0.02 || Math.abs(rawYaw) > 0.02;
  const hasThrottleInput = Number(throttle || 0) > 0.5;
  const allowSimIMU = isStreaming && hasThrottleInput && !hasRealIMU;
  const simAmplitude = 0.9;

  useEffect(() => {
    if (!allowSimIMU) {
      return;
    }

    const timer = setInterval(() => {
      setSimIMU((prev) => {
        const nextRoll = Math.max(-20, Math.min(20, prev.roll + (Math.random() - 0.5) * 2.2 * simAmplitude));
        const nextPitch = Math.max(-20, Math.min(20, prev.pitch + (Math.random() - 0.5) * 2.2 * simAmplitude));
        const nextYaw = (prev.yaw + 1 + Math.random() * 2.5) % 360;
        return { roll: nextRoll, pitch: nextPitch, yaw: nextYaw };
      });
    }, 120);

    return () => clearInterval(timer);
  }, [allowSimIMU, simAmplitude]);

  const roll = allowSimIMU ? simIMU.roll : rawRoll;
  const pitch = allowSimIMU ? simIMU.pitch : rawPitch;
  const yaw = allowSimIMU ? simIMU.yaw : rawYaw;

  const telemetry = {
    roll,
    pitch,
    yaw,
    rpm: Number(sensorData?.rpm ?? 0),
    thrust: Number(sensorData?.thrust ?? 0),
    vibration: Number(sensorData?.vibration ?? 0),
    temperature: Number(sensorData?.temperature ?? 0),
    anomaly_status: sensorData?.anomaly_status ?? "NORMAL",
    severity: Number(sensorData?.severity ?? 0),
    health: Number(sensorData?.health ?? 100),
    rul: Number(sensorData?.rul ?? 0),
    fault_type: sensorData?.fault_type ?? "None",
    connected: !!connected,
    isStreaming: !!isStreaming,
  };

  return <IMUDronePanel telemetry={telemetry} rateHz={2.0} height="100%" />;
}
