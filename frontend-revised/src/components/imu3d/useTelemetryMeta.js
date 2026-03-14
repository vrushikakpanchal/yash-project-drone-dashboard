import { useMemo } from "react";

export function useTelemetryMeta(t) {
  return useMemo(() => {
    const severity = Number(t?.severity || 0);
    const level = severity >= 0.2 ? "HIGH" : severity >= 0.08 ? "MED" : "LOW";
    const tone =
      t?.anomaly_status === "ANOMALY" || level === "HIGH"
        ? "red"
        : level === "MED"
        ? "amber"
        : "green";
    const live = !!t?.connected && !!t?.isStreaming;
    return { level, tone, live };
  }, [t?.anomaly_status, t?.connected, t?.isStreaming, t?.severity]);
}

