package com.aquora.mysql_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "borewell_readings",
    indexes = {
        @Index(
            name = "idx_device_timestamp",
            columnList = "device_id,timestamp"
        )
    }
)
public class BorewellReadings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "device_id",
        nullable = false,
        length = 50
    )
    private String deviceId;

    @Column(
        name = "village",
        length = 100
    )
    private String village;

    @Column(
        name = "district",
        length = 100
    )
    private String district;

    @Column(
        name = "dt",
        nullable = false,
        length = 100
    )
    private String dt;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "water_level")
    private Double waterLevel;

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

    @Column(name = "health_score")
    private Double healthScore;

    @Column(name = "anomaly_score")
    private Double anomalyScore;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "dynamic_threshold")
    private Double dynamicThreshold;

    @Column(
        name = "active_fault",
        columnDefinition = "TEXT"
    )
    private String activeFault;

    @Column(name = "concept_drift_detected")
    private Boolean conceptDriftDetected;


    // =========================================================
    // ID
    // =========================================================

    public Long getId() {
        return id;
    }


    // =========================================================
    // DEVICE
    // =========================================================

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }


    // =========================================================
    // VILLAGE
    // =========================================================

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }


    // =========================================================
    // DISTRICT
    // =========================================================

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }


    // =========================================================
    // DT
    // =========================================================

    public String getDt() {
        return dt;
    }

    public void setDt(String dt) {
        this.dt = dt;
    }


    // =========================================================
    // TIMESTAMP
    // =========================================================

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }


    // =========================================================
    // WATER LEVEL
    // =========================================================

    public Double getWaterLevel() {
        return waterLevel;
    }

    public void setWaterLevel(Double waterLevel) {
        this.waterLevel = waterLevel;
    }


    // =========================================================
    // TELEMETRY
    // =========================================================

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


    // =========================================================
    // ML ANALYTICS
    // =========================================================

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


    // =========================================================
    // FAULT
    // =========================================================

    public String getActiveFault() {
        return activeFault;
    }

    public void setActiveFault(String activeFault) {
        this.activeFault = activeFault;
    }


    // =========================================================
    // CONCEPT DRIFT
    // =========================================================

    public Boolean getConceptDriftDetected() {
        return conceptDriftDetected;
    }

    public void setConceptDriftDetected(
        Boolean conceptDriftDetected
    ) {
        this.conceptDriftDetected = conceptDriftDetected;
    }
}