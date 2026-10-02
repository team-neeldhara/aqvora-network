CREATE DATABASE IF NOT EXISTS neeldhaara;
USE neeldhaara;
CREATE TABLE IF NOT EXISTS borewell_readings (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 device_id VARCHAR(50) NOT NULL,
 dt VARCHAR(100) NOT NULL,
 timestamp DATETIME NOT NULL,
 water_level DOUBLE, voltage_rms DOUBLE, current_rms DOUBLE, power_factor DOUBLE,
 frequency DOUBLE, unbalance_pct DOUBLE, health_score DOUBLE, anomaly_score DOUBLE,
 confidence DOUBLE, dynamic_threshold DOUBLE, active_fault TEXT, concept_drift_detected BOOLEAN,
 INDEX idx_device_timestamp (device_id,timestamp)
);
INSERT INTO borewell_readings(device_id,dt,timestamp,water_level,voltage_rms,current_rms,power_factor,frequency,unbalance_pct,health_score,anomaly_score,confidence,dynamic_threshold,active_fault,concept_drift_detected)
VALUES('BW001','BW001_20260927T181023','2026-09-27 18:10:23',25.0,225.4,18.48,0.82,49.8,4.0,55.5,3.9908,0.98,0.7056,'["NONE"]',FALSE);
