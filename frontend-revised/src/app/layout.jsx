import "./globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext";

export const metadata = {
  title: "AI-Enabled Drone Thrust Measurement System",
  description: "Real-time drone thrust measurement dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}