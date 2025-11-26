from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException # type: ignore
from fastapi.responses import HTMLResponse # type: ignore
from typing import Dict, List, Set, Optional
import asyncio
import json
import time
import logging
from datetime import datetime
import sqlite3
import aiohttp  # Install with: pip install aiohttp
from dataclasses import dataclass, asdict
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DCK$ TOOLS Advanced Backend", version="1.0.0")

# Database initialization
def init_db():
    conn = sqlite3.connect('dck_data.db')
    cursor = conn.cursor()
    
    # Tokens table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tokens (
            address TEXT PRIMARY KEY,
            name TEXT,
            symbol TEXT,
            market_cap REAL,
            price REAL,
            volume_24h REAL,
            change_24h REAL,
            holders INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Price history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_address TEXT,
            price REAL,
            volume REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (token_address) REFERENCES tokens (address)
        )
    ''')
    
    # Alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_address TEXT,
            alert_type TEXT,
            threshold REAL,
            message TEXT,
            triggered BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (token_address) REFERENCES tokens (address)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

@dataclass
class TokenData:
    address: str
    name: str
    symbol: str
    market_cap: float
    price: float
    volume_24h: float
    change_24h: float
    holders: int
    updated_at: str = None

@dataclass
class Alert:
    token_address: str
    alert_type: str
    threshold: float
    message: str
    triggered: bool = False

class PriceTracker:
    def __init__(self):
        self.tracked_tokens = set()
        self.price_cache = {}
        self.running = False
    
    async def add_token(self, token_address: str):
        self.tracked_tokens.add(token_address)
        logger.info(f"📊 Now tracking {token_address}")
    
    async def fetch_token_data(self, token_address: str) -> Optional[TokenData]:
        try:
            async with aiohttp.ClientSession() as session:
                # Try DEXScreener first
                url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('pairs') and len(data['pairs']) > 0:
                            pair = data['pairs'][0]
                            token_data = TokenData(
                                address=token_address,
                                name=pair['baseToken']['name'] or 'Unknown',
                                symbol=pair['baseToken']['symbol'] or 'UNK',
                                market_cap=float(pair.get('marketCap', 0)),
                                price=float(pair.get('priceUsd', 0)),
                                volume_24h=float(pair.get('volume24h', 0)),
                                change_24h=float(pair.get('priceChange24h', 0)),
                                holders=0,  # DEXScreener doesn't provide holder count
                                updated_at=datetime.now().isoformat()
                            )
                            return token_data
        except Exception as e:
            logger.error(f"❌ Error fetching data for {token_address}: {e}")
        return None
    
    async def update_database(self, token_data: TokenData):
        conn = sqlite3.connect('dck_data.db')
        cursor = conn.cursor()
        
        # Update or insert token data
        cursor.execute('''
            INSERT OR REPLACE INTO tokens 
            (address, name, symbol, market_cap, price, volume_24h, change_24h, holders, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            token_data.address, token_data.name, token_data.symbol,
            token_data.market_cap, token_data.price, token_data.volume_24h,
            token_data.change_24h, token_data.holders, token_data.updated_at
        ))
        
        # Add price history
        cursor.execute('''
            INSERT INTO price_history (token_address, price, volume)
            VALUES (?, ?, ?)
        ''', (token_data.address, token_data.price, token_data.volume_24h))
        
        conn.commit()
        conn.close()
    
    async def start_monitoring(self):
        self.running = True
        logger.info("🚀 Starting price monitoring...")
        
        while self.running:
            for token_address in list(self.tracked_tokens):
                token_data = await self.fetch_token_data(token_address)
                if token_data:
                    await self.update_database(token_data)
                    self.price_cache[token_address] = asdict(token_data)
                    
                    # Broadcast to WebSocket clients
                    await manager.broadcast_to_all(json.dumps({
                        "type": "price_update",
                        "data": asdict(token_data)
                    }))
                    
                    # Check alerts
                    await self.check_alerts(token_data)
                
                await asyncio.sleep(1)  # Rate limiting
            
            await asyncio.sleep(10)  # Update cycle every 10 seconds
    
    async def check_alerts(self, token_data: TokenData):
        conn = sqlite3.connect('dck_data.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM alerts 
            WHERE token_address = ? AND triggered = FALSE
        ''', (token_data.address,))
        
        alerts = cursor.fetchall()
        for alert_row in alerts:
            alert_id, token_addr, alert_type, threshold, message, triggered, created_at = alert_row
            
            should_trigger = False
            if alert_type == "price_above" and token_data.price > threshold:
                should_trigger = True
            elif alert_type == "price_below" and token_data.price < threshold:
                should_trigger = True
            elif alert_type == "volume_above" and token_data.volume_24h > threshold:
                should_trigger = True
            
            if should_trigger:
                cursor.execute('''
                    UPDATE alerts SET triggered = TRUE WHERE id = ?
                ''', (alert_id,))
                
                # Broadcast alert
                await manager.broadcast_to_all(json.dumps({
                    "type": "alert_triggered",
                    "data": {
                        "token": token_data.address,
                        "message": message,
                        "current_price": token_data.price,
                        "threshold": threshold
                    }
                }))
                
                logger.info(f"🚨 ALERT: {message} for {token_data.symbol}")
        
        conn.commit()
        conn.close()

price_tracker = PriceTracker()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.token_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, token_address: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if token_address:
            if token_address not in self.token_connections:
                self.token_connections[token_address] = set()
            self.token_connections[token_address].add(websocket)
            await price_tracker.add_token(token_address)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from token-specific connections
        for token_addr, connections in self.token_connections.items():
            if websocket in connections:
                connections.remove(websocket)

    async def broadcast_to_all(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                await self.disconnect(connection)

    async def broadcast_to_token(self, token_address: str, message: str):
        if token_address in self.token_connections:
            for connection in list(self.token_connections[token_address]):
                try:
                    await connection.send_text(message)
                except:
                    self.token_connections[token_address].remove(connection)

manager = ConnectionManager()

# API Endpoints
@app.get("/")
async def root():
    return {
        "status": "DCK$ TOOLS Advanced Backend Running",
        "version": "1.0.0",
        "features": ["Price Tracking", "Alerts", "WebSocket", "Dashboard"],
        "tracked_tokens": len(price_tracker.tracked_tokens)
    }

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>DCK$ TOOLS Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .stat-card { background: #1a1a1a; padding: 20px; border-radius: 10px; border: 2px solid #ff0080; }
            .neon { color: #00bfff; text-shadow: 0 0 10px #00bfff; }
            .pink { color: #ff0080; text-shadow: 0 0 10px #ff0080; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="neon">DCK$ TOOLS DASHBOARD</h1>
            <p>Real-time monitoring and analytics</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <h3 class="pink">Tracked Tokens</h3>
                <p id="tracked-count">Loading...</p>
            </div>
            <div class="stat-card">
                <h3 class="neon">Active Alerts</h3>
                <p id="alert-count">Loading...</p>
            </div>
            <div class="stat-card">
                <h3 class="pink">System Status</h3>
                <p id="system-status">Running</p>
            </div>
        </div>
        <script>
            const ws = new WebSocket('ws://localhost:8000/ws/monitor');
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'price_update') {
                    console.log('Price update:', data.data);
                }
            };
        </script>
    </body>
    </html>
    """

@app.get("/tokens")
async def get_tokens():
    conn = sqlite3.connect('dck_data.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tokens ORDER BY updated_at DESC')
    tokens = cursor.fetchall()
    conn.close()
    
    return [
        {
            "address": row[0], "name": row[1], "symbol": row[2],
            "market_cap": row[3], "price": row[4], "volume_24h": row[5],
            "change_24h": row[6], "holders": row[7], "updated_at": row[9]
        }
        for row in tokens
    ]

@app.post("/track/{token_address}")
async def track_token(token_address: str):
    await price_tracker.add_token(token_address)
    return {"status": "tracking", "token": token_address}

@app.post("/alerts")
async def create_alert(alert_data: dict):
    conn = sqlite3.connect('dck_data.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO alerts (token_address, alert_type, threshold, message)
        VALUES (?, ?, ?, ?)
    ''', (
        alert_data['token_address'],
        alert_data['alert_type'],
        alert_data['threshold'],
        alert_data['message']
    ))
    
    conn.commit()
    conn.close()
    
    return {"status": "alert_created", "data": alert_data}

@app.get("/sniper/{token_address}")
async def sniper_analysis(token_address: str):
    # Advanced sniper detection logic
    token_data = await price_tracker.fetch_token_data(token_address)
    if not token_data:
        return {"error": "Token not found"}
    
    # Analyze for sniper patterns
    analysis = {
        "token": token_address,
        "risk_level": "medium",
        "volume_spike": token_data.volume_24h > 100000,
        "price_volatility": abs(token_data.change_24h) > 50,
        "market_cap_range": "micro" if token_data.market_cap < 100000 else "small",
        "sniper_indicators": {
            "high_volume": token_data.volume_24h > 500000,
            "rapid_price_change": abs(token_data.change_24h) > 100,
            "low_market_cap": token_data.market_cap < 50000
        }
    }
    
    return analysis

@app.websocket("/ws/monitor")
async def websocket_monitor(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe":
                token_address = message.get("token")
                if token_address:
                    await price_tracker.add_token(token_address)
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "token": token_address
                    }))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/chat/{token_address}")
async def websocket_chat(websocket: WebSocket, token_address: str):
    await manager.connect(websocket, token_address)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast_to_token(token_address, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Start price monitoring on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(price_tracker.start_monitoring())
    logger.info("🚀 DCK$ TOOLS Advanced Backend Started!")