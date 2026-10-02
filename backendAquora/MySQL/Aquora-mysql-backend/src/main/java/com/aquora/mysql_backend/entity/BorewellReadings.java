package com.aquora.mysql_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "borewell_readings")
public class BorewellReadings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ============================================================
    // DEVICE INFORMATION
    // ============================================================

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "dt")
    private String dt;

    @Column(name = "timestamp")
    private java.time.LocalDateTime timestamp;


    // ============================================================
    // BOREWELL LOCATION INFORMATION
    // ============================================================

    @Column(name = "district")
    private String district;

    @Column(name = "village")
    private String village;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;


    // ============================================================
    // WATER INFORMATION
    // ============================================================

    @Column(name = "water_level")
    private Double waterLevel;


    // ============================================================
    // ELECTRICAL / MOTOR TELEMETRY
    // ============================================================

    @Column(name = "voltage_rms")
    private Double voltageRms;

    @Column(name = "current_rms")
    private Double currentRms;

    @Column(name = "power_factor")
    private Double powerFactor;

    @Column(name = "frequency")
    private Double frequency;

    @Column(name = "unbalance_pct")
    private Double unbalancePct;


    // ============================================================
    // ML / ANALYTICS
    // ============================================================

    @Column(name = "health_score")
    private Double healthScore;

    @Column(name = "anomaly_score")
    private Double anomalyScore;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "dynamic_threshold")
    private Double dynamicThreshold;

    @Column(name = "active_fault")
    private String activeFault;

    @Column(name = "concept_drift_detected")
    private Boolean conceptDriftDetected;


    // ============================================================
    // CONSTRUCTORS
    // ============================================================

    public BorewellReadings() {
    }


    // ============================================================
    // GETTERS AND SETTERS
    // ============================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }


    public String getDt() {
        return dt;
    }

    public void setDt(String dt) {
        this.dt = dt;
    }


    public java.time.LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(java.time.LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }


    // ============================================================
    // LOCATION GETTERS / SETTERS
    // ============================================================

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }


    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }


    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }


    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }


    // ============================================================
    // WATER GETTERS / SETTERS
    // ============================================================

    public Double getWaterLevel() {
        return waterLevel;
    }

    public void setWaterLevel(Double waterLevel) {
        this.waterLevel = waterLevel;
    }


    // ============================================================
    // TELEMETRY GETTERS / SETTERS
    // ============================================================

    public Double getVoltageRms() {
        return voltageRms;
    }

    public void setVoltageRms(Double voltageRms) {
        this.voltageRms = voltageRms;
    }


    public Double getCurrentRms() {
        return currentRms;
    }

    public void setCurrentRms(Double currentRms) {
        this.currentRms = currentRms;
    }


    public Double getPowerFactor() {
        return powerFactor;
    }

    public void setPowerFactor(Double powerFactor) {
        this.powerFactor = powerFactor;
    }


    public Double getFrequency() {
        return frequency;
    }

    public void setFrequency(Double frequency) {
        this.frequency = frequency;
    }


    public Double getUnbalancePct() {
        return unbalancePct;
    }

    public void setUnbalancePct(Double unbalancePct) {
        this.unbalancePct = unbalancePct;
    }


    // ============================================================
    // ML / ANALYTICS GETTERS / SETTERS
    // ============================================================

    public Double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Double healthScore) {
        this.healthScore = healthScore;
    }


    public Double getAnomalyScore() {
        return anomalyScore;
    }

    public void setAnomalyScore(Double anomalyScore) {
        this.anomalyScore = anomalyScore;
    }


    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }


    public Double getDynamicThreshold() {
        return dynamicThreshold;
    }

    public void setDynamicThreshold(Double dynamicThreshold) {
        this.dynamicThreshold = dynamicThreshold;
    }


    public String getActiveFault() {
        return activeFault;
    }

    public void setActiveFault(String activeFault) {
        this.activeFault = activeFault;
    }


    public Boolean getConceptDriftDetected() {
        return conceptDriftDetected;
    }

    public void setConceptDriftDetected(Boolean conceptDriftDetected) {
        this.conceptDriftDetected = conceptDriftDetected;
    }
}