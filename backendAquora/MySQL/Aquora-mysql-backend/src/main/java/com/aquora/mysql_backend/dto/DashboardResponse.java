package com.aquora.mysql_backend.dto;

import com.aquora.mysql_backend.entity.BorewellReadings;

public class DashboardResponse {

    private String deviceId;
    private String dt;
    private String timestamp;

    private Double waterLevel;

    private Double voltageRms;
    private Double currentRms;
    private Double powerFactor;
    private Double frequency;
    private Double unbalancePct;

    private Double healthScore;
    private Double anomalyScore;
    private Double confidence;
    private Double dynamicThreshold;

    private String activeFault;
    private Boolean conceptDriftDetected;

    private long totalReadings;

    public DashboardResponse(
            BorewellReadings reading,
            long totalReadings) {

        this.deviceId = reading.getDeviceId();
        this.dt = reading.getDt();

        this.timestamp = reading.getTimestamp() != null
                ? reading.getTimestamp().toString()
                : null;

        this.waterLevel = reading.getWaterLevel();

        this.voltageRms = reading.getVoltageRms();
        this.currentRms = reading.getCurrentRms();
        this.powerFactor = reading.getPowerFactor();
        this.frequency = reading.getFrequency();
        this.unbalancePct = reading.getUnbalancePct();

        this.healthScore = reading.getHealthScore();
        this.anomalyScore = reading.getAnomalyScore();
        this.confidence = reading.getConfidence();
        this.dynamicThreshold = reading.getDynamicThreshold();

        this.activeFault = reading.getActiveFault();
        this.conceptDriftDetected = reading.getConceptDriftDetected();

        this.totalReadings = totalReadings;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String getDt() {
        return dt;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public Double getWaterLevel() {
        return waterLevel;
    }

    public Double getVoltageRms() {
        return voltageRms;
    }

    public Double getCurrentRms() {
        return currentRms;
    }

    public Double getPowerFactor() {
        return powerFactor;
    }

    public Double getFrequency() {
        return frequency;
    }

    public Double getUnbalancePct() {
        return unbalancePct;
    }

    public Double getHealthScore() {
        return healthScore;
    }

    public Double getAnomalyScore() {
        return anomalyScore;
    }

    public Double getConfidence() {
        return confidence;
    }

    public Double getDynamicThreshold() {
        return dynamicThreshold;
    }

    public String getActiveFault() {
        return activeFault;
    }

    public Boolean getConceptDriftDetected() {
        return conceptDriftDetected;
    }

    public long getTotalReadings() {
        return totalReadings;
    }
}