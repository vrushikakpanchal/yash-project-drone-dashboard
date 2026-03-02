# from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# import os
# import asyncio
# import json
# from datetime import datetime
# from typing import List
# from pydantic import BaseModel
# from microservices.src.realtime_pi_inference import build_feature_dict, get_motor_data_snapshot

# # SETTING UP THE APP
# load_dotenv()
# app = FastAPI()

# # Configure CORS
# allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=allowed_origins,
#     allow_credentials=True,
#     allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
#     allow_headers=["*"]  # Allow all headers
# )

# # WebSocket Manager Class
# class WebSocketManager:
#     def __init__(self):
#         self.active_connections: List[WebSocket] = []
#         self.is_streaming = False
#         self.streaming_task = None
        
#         # Analysis data collection arrays
#         self.session_start_time = None
#         self.thrust_analysis_data = []
#         self.anomaly_analysis_data = []
#         self.health_analysis_data = []

#     async def connect(self, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections.append(websocket)

#     def disconnect(self, websocket: WebSocket):
#         if websocket in self.active_connections:
#             self.active_connections.remove(websocket)

#     async def broadcast(self, data: dict):
#         if self.active_connections:
#             message = json.dumps(data)
#             disconnected = []
#             for connection in self.active_connections:
#                 try:
#                     await connection.send_text(message)
#                 except:
#                     disconnected.append(connection)
            
#             # Remove disconnected connections
#             for connection in disconnected:
#                 self.disconnect(connection)

#     async def start_streaming(self):
#         if not self.is_streaming:
#             self.is_streaming = True
#             # Clear previous analysis data and start new session
#             self.session_start_time = datetime.now()
#             self.thrust_analysis_data.clear()
#             self.anomaly_analysis_data.clear()
#             self.health_analysis_data.clear()
#             self.streaming_task = asyncio.create_task(self._stream_motor_data())

#     async def stop_streaming(self):
#         self.is_streaming = False
#         if self.streaming_task:
#             self.streaming_task.cancel()
#             try:
#                 await self.streaming_task
#             except asyncio.CancelledError:
#                 pass

#     async def _stream_motor_data(self):
#         try:
#             while self.is_streaming:
#                 data = get_motor_data_snapshot()
                
#                 # Collect analysis data for charts
#                 timestamp = datetime.now().isoformat()
                
#                 # Store thrust analysis data
#                 self.thrust_analysis_data.append({
#                     "time": timestamp,
#                     "predicted_thrust": data["thrust"],
#                     "rpm": data["rpm"]
#                 })
                
#                 # Store anomaly analysis data
#                 self.anomaly_analysis_data.append({
#                     "time": timestamp,
#                     "severity_score": data["severity"],
#                     "anomaly_flag": -1 if data["anomaly_status"] == "ANOMALY" else 1,
#                     "anomaly_status": data["anomaly_status"]
#                 })
                
#                 # Store health analysis data
#                 self.health_analysis_data.append({
#                     "time": timestamp,
#                     "health_score": data["health"],
#                     "rul_hours": data["rul"],
#                     "fault_type": data["fault_type"]
#                 })
                
#                 # Keep only last 200 data points to prevent memory issues
#                 if len(self.thrust_analysis_data) > 200:
#                     self.thrust_analysis_data.pop(0)
#                     self.anomaly_analysis_data.pop(0)
#                     self.health_analysis_data.pop(0)
                
#                 await self.broadcast(data)
#                 await asyncio.sleep(0.5)  # 2Hz frequency
#         except asyncio.CancelledError:
#             pass

#     def get_analysis_data(self):
#         """Get collected analysis data for charts"""
#         if not self.session_start_time:
#             return None
            
#         duration = (datetime.now() - self.session_start_time).total_seconds()
        
#         return {
#             "session_info": {
#                 "start_time": self.session_start_time.isoformat(),
#                 "duration_seconds": round(duration, 1),
#                 "data_points": len(self.thrust_analysis_data)
#             },
#             "thrust_analysis": self.thrust_analysis_data,
#             "anomaly_analysis": self.anomaly_analysis_data,
#             "health_analysis": self.health_analysis_data
#         }

# # Global WebSocket manager instance
# manager = WebSocketManager()


# # Health check endpoint for deployment
# @app.get("/health")
# def health_check():
#     return {"status": "healthy", "message": "Backend is running"}


# @app.websocket("/ws/motor-data")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             # Keep connection alive and handle messages if needed
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)

# @app.post("/start-stream")
# async def start_stream():
#     await manager.start_streaming()
#     return {
#         "status": "success", 
#         "message": "Motor data streaming started",
#         "websocket_url": "/ws/motor-data",
#         "frequency": "2Hz"
#     }

# @app.post("/stop-stream")
# async def stop_stream():
#     await manager.stop_streaming()
#     return {
#         "status": "success", 
#         "message": "Motor data streaming stopped",
#         "analysis_data_available": manager.get_analysis_data() is not None
#     }

# @app.get("/analysis-data")
# def get_analysis_data():
#     """Get collected analysis data for frontend charts"""
#     analysis_data = manager.get_analysis_data()
    
#     if analysis_data is None:
#         return {
#             "status": "no_data",
#             "message": "No analysis data available. Start and stop a simulation first."
#         }
    
#     return {
#         "status": "success",
#         "message": "Analysis data retrieved successfully",
#         "data": analysis_data
#     }

# @app.get("/get-data")
# def get_data():
#     return {
#         "status": "healthy", 
#         "message": "Backend is running",
#         "streaming_active": manager.is_streaming,
#         "active_connections": len(manager.active_connections),
#         "websocket_url": "ws://localhost:8000/ws/motor-data",
#         "endpoints": {
#             "start_stream": "/start-stream",
#             "stop_stream": "/stop-stream",
#             "websocket": "/ws/motor-data"
#         }
#     }

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
import json
from datetime import datetime
from typing import List
from pydantic import BaseModel
from microservices.src.realtime_pi_inference import build_feature_dict, get_motor_data_snapshot

# SETTING UP THE APP
load_dotenv()
app = FastAPI()

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# WebSocket Manager Class
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_streaming = False
        self.streaming_task = None
        
        # Analysis data collection arrays
        self.session_start_time = None
        self.thrust_analysis_data = []
        self.anomaly_analysis_data = []
        self.health_analysis_data = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        if self.active_connections:
            message = json.dumps(data)
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            for connection in disconnected:
                self.disconnect(connection)

    async def start_streaming(self):
        if not self.is_streaming:
            self.is_streaming = True
            self.session_start_time = datetime.now()
            self.thrust_analysis_data.clear()
            self.anomaly_analysis_data.clear()
            self.health_analysis_data.clear()
            self.streaming_task = asyncio.create_task(self._stream_motor_data())

    async def stop_streaming(self):
        self.is_streaming = False
        if self.streaming_task:
            self.streaming_task.cancel()
            try:
                await self.streaming_task
            except asyncio.CancelledError:
                pass

    async def _stream_motor_data(self):
        try:
            while self.is_streaming:
                data = get_motor_data_snapshot()
                
                timestamp = datetime.now().isoformat()
                
                self.thrust_analysis_data.append({
                    "time": timestamp,
                    "predicted_thrust": data["thrust"],
                    "rpm": data["rpm"]
                })
                self.anomaly_analysis_data.append({
                    "time": timestamp,
                    "severity_score": data["severity"],
                    "anomaly_flag": -1 if data["anomaly_status"] == "ANOMALY" else 1,
                    "anomaly_status": data["anomaly_status"]
                })
                self.health_analysis_data.append({
                    "time": timestamp,
                    "health_score": data["health"],
                    "rul_hours": data["rul"],
                    "fault_type": data["fault_type"]
                })
                
                # Keep only last 200 data points
                if len(self.thrust_analysis_data) > 200:
                    self.thrust_analysis_data.pop(0)
                    self.anomaly_analysis_data.pop(0)
                    self.health_analysis_data.pop(0)
                
                await self.broadcast(data)
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            pass

    def get_analysis_data(self):
        if not self.session_start_time:
            return None
        duration = (datetime.now() - self.session_start_time).total_seconds()
        return {
            "session_info": {
                "start_time": self.session_start_time.isoformat(),
                "duration_seconds": round(duration, 1),
                "data_points": len(self.thrust_analysis_data)
            },
            "thrust_analysis": self.thrust_analysis_data,
            "anomaly_analysis": self.anomaly_analysis_data,
            "health_analysis": self.health_analysis_data
        }

# Global WebSocket manager instance
manager = WebSocketManager()


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}


# ── FIXED: WS endpoint keeps connection alive with asyncio.sleep ──
# Problem before: `receive_text()` immediately errored when frontend
# sent nothing, closing the connection before any data could be broadcast.
@app.websocket("/ws/motor-data")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open. Use wait_for so we don't block
            # broadcast — if frontend sends a message we handle it,
            # otherwise we just loop every second to check if still alive.
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=1.0
                )
                # Optional: handle any commands frontend might send
                # e.g. {"type": "ping"} → ignore, or handle throttle cmds
            except asyncio.TimeoutError:
                # No message from client — that's fine, just keep looping
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@app.post("/start-stream")
async def start_stream():
    await manager.start_streaming()
    return {
        "status": "success",
        "message": "Motor data streaming started",
        "websocket_url": "/ws/motor-data",
        "frequency": "2Hz"
    }

@app.post("/stop-stream")
async def stop_stream():
    await manager.stop_streaming()
    return {
        "status": "success",
        "message": "Motor data streaming stopped",
        "analysis_data_available": manager.get_analysis_data() is not None
    }

@app.get("/analysis-data")
def get_analysis_data():
    analysis_data = manager.get_analysis_data()
    if analysis_data is None:
        return {
            "status": "no_data",
            "message": "No analysis data available. Start and stop a simulation first."
        }
    return {
        "status": "success",
        "message": "Analysis data retrieved successfully",
        "data": analysis_data
    }

@app.get("/get-data")
def get_data():
    return {
        "status": "healthy",
        "message": "Backend is running",
        "streaming_active": manager.is_streaming,
        "active_connections": len(manager.active_connections),
        "websocket_url": "ws://localhost:8000/ws/motor-data",
        "endpoints": {
            "start_stream": "/start-stream",
            "stop_stream": "/stop-stream",
            "websocket": "/ws/motor-data"
        }
    }