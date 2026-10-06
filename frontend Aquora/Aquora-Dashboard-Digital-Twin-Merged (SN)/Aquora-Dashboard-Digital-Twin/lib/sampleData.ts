// FINAL ML PAYLOAD. Keep this object/schema unchanged when connecting the real ML service.
export const mlPayload = {
  device_id: "BW001",
  dt: "BW001_20260927T181023",
  water_level: 25.0,
  telemetry: {
    voltage_rms: 225.4,
    current_rms: 18.48,
    power_factor: 0.82,
    frequency: 49.8,
    unbalance_pct: 4.0
  },
  ml_analytics: {
    health_score: 55.5,
    anomaly_score: 3.9908,
    confidence: 0.98,
    dynamic_threshold: 0.7056,
    active_faults: ["NONE"],
    concept_drift_detected: false
  }
};

// Presentation-only profile information. It does not alter the ML payload.
export const farmerProfile = {
  name: "Ramesh Patil",
  role: "Farmer",
  location: "Pune, Maharashtra",
  temperature: "28°C",
  weatherLabel: "Sunny"
};

// Only used for the visual field list in the supplied reference. These are not sensor/ML readings.


// Demo-only chart history for visual layout. The current value always comes from mlPayload.water_level.
export const demoWaterHistory = [24.0, 24.8, 24.3, 24.6, 24.9, 24.5, 25.0];
