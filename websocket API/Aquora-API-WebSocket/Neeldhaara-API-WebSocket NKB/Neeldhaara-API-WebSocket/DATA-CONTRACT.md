# Neeldhaara integration contract

## Fixed ML input
Do not change the ML JSON field names or nesting.

## MySQL → API mapping
- device_id → deviceId
- dt → dt
- timestamp → timestamp
- water_level → waterLevel
- telemetry.voltage_rms → telemetry.voltageRms
- telemetry.current_rms → telemetry.currentRms
- telemetry.power_factor → telemetry.powerFactor
- telemetry.frequency → telemetry.frequency
- telemetry.unbalance_pct → telemetry.unbalancePct
- ml_analytics.health_score → mlAnalytics.healthScore
- ml_analytics.anomaly_score → mlAnalytics.anomalyScore
- ml_analytics.confidence → mlAnalytics.confidence
- ml_analytics.dynamic_threshold → mlAnalytics.dynamicThreshold
- ml_analytics.active_faults → mlAnalytics.activeFaults
- ml_analytics.concept_drift_detected → mlAnalytics.conceptDriftDetected

## Frontend rule
Never connect the browser directly to MySQL. Browser uses REST + WebSocket only.

## Live-data rule
REST = initial/history. WebSocket = live changes.
