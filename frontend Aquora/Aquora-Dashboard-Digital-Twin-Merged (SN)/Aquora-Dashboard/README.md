# Aquora — Smart Borewell Health & Sustainability Dashboard

A farmer-friendly Next.js dashboard redesigned around the supplied Neeldhara reference image. It keeps the agreed ML JSON payload intact, exposes telemetry/ML details without making the home screen feel like an industrial SCADA panel, and includes a working Digital Twin view.

## 1. Install

Requirements: Node.js 18+ (Node 20+ recommended).

```bash
npm install
```

## 2. Run the frontend

```bash
npm run dev
```

Open `http://localhost:3000`.

## 3. Run the backend

This ZIP contains the frontend/dashboard only because the supplied project ZIP did not contain a backend. The frontend is structured so the exact ML payload can be connected at the `lib/sampleData.ts` boundary without changing the UI schema.

## 4. Mock JSON location

The exact agreed ML object is in:

`lib/sampleData.ts` → `mlPayload`

Do not rename fields, change nesting, change types, or add ML fields to this object.

## 5. API integration boundary

The dashboard imports the same `mlPayload` object throughout the UI. For a live REST/WebSocket integration, replace the source of `mlPayload` with the exact backend response while preserving this shape:

- `device_id`
- `dt`
- `water_level`
- `telemetry.voltage_rms`
- `telemetry.current_rms`
- `telemetry.power_factor`
- `telemetry.frequency`
- `telemetry.unbalance_pct`
- `ml_analytics.health_score`
- `ml_analytics.anomaly_score`
- `ml_analytics.confidence`
- `ml_analytics.dynamic_threshold`
- `ml_analytics.active_faults`
- `ml_analytics.concept_drift_detected`

`farmerProfile`, `fieldOverview`, and `demoWaterHistory` are presentation/demo data and are kept separate from the ML payload.

## 6. Digital Twin

Click **Digital Twin** in the sidebar or Quick Actions. It opens `/digital-twin`.

The Digital Twin uses the same `mlPayload` object as the main dashboard. The underground water layer and water-table marker respond to `water_level`. Electrical values and ML values are read directly from `telemetry` and `ml_analytics`. Active faults and concept drift are dynamic.

## 7. Connecting the real ML JSON

Keep the JSON schema exactly as agreed. Update the data source, not the UI field names. If the API is unavailable, the current exact example payload in `lib/sampleData.ts` provides the local demo fallback.

## Validation

The project is intended to run with `npm install`, `npm run dev`, and `npm run build`. The included implementation has no external image URL dependency; the natural farm visuals are stored locally in `public/assets/`, so the dashboard remains usable offline.
