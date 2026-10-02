# Neeldhaara — MySQL + Spring Boot REST API + WebSocket + Three.js Digital Twin

## What this package does
This is the integration layer for your task:

ESP32 + Edge AI → MQTT/ingestion layer → MySQL → Spring Boot REST API + WebSocket → frontend/digital twin

The original ML JSON structure is not changed.

## Backend
- Spring Boot 4.1.1
- Java 21
- MySQL + Spring Data JPA
- REST API on port 8081
- Native WebSocket on `/ws`
- Prototype DB-to-WebSocket publisher checks MySQL every 1 second and broadcasts only when a new row appears.

### REST
```text
GET http://localhost:8081/api/v1/health
GET http://localhost:8081/api/v1/borewells/BW001/latest
GET http://localhost:8081/api/v1/borewells/BW001/history?limit=100
```

### WebSocket
```text
ws://localhost:8081/ws
```

The WebSocket message has the same JSON structure as the REST latest response. The frontend filters by `deviceId`.

## Database
Create `neeldhaara` and set credentials in `backend/src/main/resources/application.properties`, or use environment variables:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

Run `backend/database/schema.sql` if you want to create the table and insert a test row.

## Frontend
The provided `frontend/components/PumpModel.jsx` keeps the existing Three.js digital-twin geometry/style and changes the data connection to:

1. REST for initial state
2. WebSocket for live updates
3. nested `telemetry` + `mlAnalytics` data
4. `activeFaults` from ML instead of recreating the ML fault logic

The component is set up for Next.js. Run from `frontend`:

```bash
npm install
npm run dev
```

Optional `.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

## Important integration note
The ML payload remains:

```json
{
  "device_id": "BW001",
  "dt": "BW001_20260927T181023",
  "water_level": 25.0,
  "telemetry": {
    "voltage_rms": 225.4,
    "current_rms": 18.48,
    "power_factor": 0.82,
    "frequency": 49.8,
    "unbalance_pct": 4.0
  },
  "ml_analytics": {
    "health_score": 55.5,
    "anomaly_score": 3.9908,
    "confidence": 0.98,
    "dynamic_threshold": 0.7056,
    "active_faults": ["NONE"],
    "concept_drift_detected": false
  }
}
```

The API DTO uses camelCase only at the database/API boundary so that the React code can use normal JavaScript property names.

## Prototype vs production
This package intentionally uses MySQL polling for the WebSocket publisher because the prototype database is the source requested for the current architecture. In the final AWS architecture, the ingestion/event path can publish live events directly to the WebSocket layer while DynamoDB remains the persistence layer.
