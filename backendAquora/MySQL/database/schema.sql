-- ============================================================
-- AQUORA / NEELDHAARA
-- Database Schema
-- ============================================================

-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS neeldhaara;

USE neeldhaara;


-- ============================================================
-- BOREWELL READINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS borewell_readings (

    id BIGINT NOT NULL AUTO_INCREMENT,

    -- Device information
    device_id VARCHAR(255),
    dt VARCHAR(255),
    timestamp DATETIME,

    -- Borewell location
    district VARCHAR(100),
    village VARCHAR(100),
    latitude DOUBLE,
    longitude DOUBLE,

    -- Water information
    water_level DOUBLE,

    -- Electrical / motor telemetry
    voltage_rms DOUBLE,
    current_rms DOUBLE,
    power_factor DOUBLE,
    frequency DOUBLE,
    unbalance_pct DOUBLE,

    -- ML analytics
    health_score DOUBLE,
    anomaly_score DOUBLE,
    confidence DOUBLE,
    dynamic_threshold DOUBLE,
    active_fault VARCHAR(255),
    concept_drift_detected BOOLEAN,

    -- Primary key
    PRIMARY KEY (id)

);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_device_id
ON borewell_readings(device_id);

CREATE INDEX idx_timestamp
ON borewell_readings(timestamp);

CREATE INDEX idx_district
ON borewell_readings(district);

CREATE INDEX idx_active_fault
ON borewell_readings(active_fault);

CREATE INDEX idx_location
ON borewell_readings(latitude, longitude);


-- ============================================================
-- OPTIONAL: VERIFY TABLE STRUCTURE
-- ============================================================

DESCRIBE borewell_readings;