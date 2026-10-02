# Aquora Government Dashboard

React + Vite dashboard using native browser WebSocket (no STOMP), REST fetch, and Mapbox GL JS.

## Setup
1. npm install
2. Copy .env.example to .env
3. Put your public Mapbox token in VITE_MAPBOX_TOKEN
4. npm run dev

Defaults:
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_WS_URL=ws://localhost:8081/ws/government

Expected REST:
GET /government/summary
GET /government/borewells/locations
GET /government/water-level-trend
GET /government/alerts
GET /government/grid
GET /government/borewells

Raw WebSocket messages use:
{"type":"SUMMARY","payload":{...}}
{"type":"ALERT","payload":{...}}
{"type":"BOREWELL","payload":{...}}
{"type":"GRID","payload":{...}}

The frontend does not connect directly to MySQL or MQTT. If the backend currently exposes STOMP instead of raw WebSocket, it must provide /ws/government as a plain WebSocket endpoint.
