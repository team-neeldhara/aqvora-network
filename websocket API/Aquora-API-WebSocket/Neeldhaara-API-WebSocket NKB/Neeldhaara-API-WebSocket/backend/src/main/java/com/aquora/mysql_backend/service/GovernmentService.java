
package com.aquora.mysql_backend.service;

import com.aquora.mysql_backend.entity.BorewellReadings;
import com.aquora.mysql_backend.repository.BorewellReadingsRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class GovernmentService {

    private final BorewellReadingsRepository repository;

    public GovernmentService(BorewellReadingsRepository repository) {
        this.repository = repository;
    }

    // =========================================================
    // GOVERNMENT SUMMARY
    // =========================================================

    public Map<String, Object> getSummary() {

        List<BorewellReadings> all = repository.findAll();

        List<BorewellReadings> latest =
                getLatestPerDevice(all);

        Set<String> devices = new HashSet<>();

        for (BorewellReadings reading : all) {
            if (reading.getDeviceId() != null) {
                devices.add(reading.getDeviceId());
            }
        }

        long activeAlerts = latest.stream()
                .filter(this::hasAlert)
                .count();

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put("totalBorewells", devices.size());
        result.put("onlineBorewells", latest.size());

        result.put(
                "averageWaterLevel",
                averageWaterLevel(latest)
        );

        result.put(
                "averageHealthScore",
                averageHealthScore(latest)
        );

        result.put("activeAlerts", activeAlerts);

        return result;
    }

    // =========================================================
    // ALL CURRENT BOREWELLS
    // =========================================================

    public List<Map<String, Object>> getBorewells() {

        return getLatestPerDevice(repository.findAll())
                .stream()
                .map(this::toMap)
                .toList();
    }

    // =========================================================
    // BOREWELL LOCATIONS
    // Village + District
    // =========================================================

    public List<Map<String, Object>> getLocations() {

        List<BorewellReadings> all =
                repository.findAll();

        Map<String, BorewellReadings> latestWithLocation =
                new HashMap<>();

        for (BorewellReadings reading : all) {

            String deviceId = reading.getDeviceId();

            if (deviceId == null) {
                continue;
            }

            /*
             * We only use records where village and district
             * are actually available.
             */
            if (reading.getVillage() == null
                    || reading.getVillage().isBlank()
                    || reading.getDistrict() == null
                    || reading.getDistrict().isBlank()) {
                continue;
            }

            BorewellReadings current =
                    latestWithLocation.get(deviceId);

            if (current == null) {
                latestWithLocation.put(deviceId, reading);
                continue;
            }

            if (reading.getTimestamp() != null
                    && current.getTimestamp() != null
                    && reading.getTimestamp()
                    .isAfter(current.getTimestamp())) {

                latestWithLocation.put(deviceId, reading);
            }
        }

        return latestWithLocation.values()
                .stream()
                .map(this::locationToMap)
                .sorted(
                        Comparator.comparing(
                                x -> String.valueOf(
                                        x.get("deviceId")
                                )
                        )
                )
                .toList();
    }

    // =========================================================
    // WATER LEVEL TREND
    // =========================================================

    public List<Map<String, Object>> getWaterLevelTrend() {

        return repository.findAll()
                .stream()
                .filter(
                        reading ->
                                reading.getTimestamp() != null
                )
                .filter(
                        reading ->
                                reading.getWaterLevel() != null
                )
                .sorted(
                        Comparator.comparing(
                                BorewellReadings::getTimestamp
                        )
                )
                .map(reading -> {

                    Map<String, Object> item =
                            new LinkedHashMap<>();

                    item.put(
                            "deviceId",
                            reading.getDeviceId()
                    );

                    item.put(
                            "village",
                            reading.getVillage()
                    );

                    item.put(
                            "district",
                            reading.getDistrict()
                    );

                    item.put(
                            "timestamp",
                            reading.getTimestamp()
                    );

                    item.put(
                            "waterLevel",
                            reading.getWaterLevel()
                    );

                    return item;
                })
                .toList();
    }

    // =========================================================
    // GOVERNMENT ALERTS
    // =========================================================

    public List<Map<String, Object>> getAlerts() {

        return getLatestPerDevice(repository.findAll())
                .stream()
                .filter(this::hasAlert)
                .map(reading -> {

                    Map<String, Object> alert =
                            new LinkedHashMap<>();

                    alert.put(
                            "deviceId",
                            reading.getDeviceId()
                    );

                    alert.put(
                            "village",
                            reading.getVillage()
                    );

                    alert.put(
                            "district",
                            reading.getDistrict()
                    );

                    alert.put(
                            "timestamp",
                            reading.getTimestamp()
                    );

                    alert.put(
                            "activeFault",
                            reading.getActiveFault()
                    );

                    alert.put(
                            "anomalyScore",
                            reading.getAnomalyScore()
                    );

                    alert.put(
                            "dynamicThreshold",
                            reading.getDynamicThreshold()
                    );

                    alert.put(
                            "healthScore",
                            reading.getHealthScore()
                    );

                    alert.put(
                            "conceptDriftDetected",
                            reading.getConceptDriftDetected()
                    );

                    return alert;
                })
                .toList();
    }

    // =========================================================
    // GRID / PUMP HEALTH
    // =========================================================

    public List<Map<String, Object>> getGrid() {
        return getBorewells();
    }

    // =========================================================
    // LATEST READING FOR EACH DEVICE
    // =========================================================

    private List<BorewellReadings> getLatestPerDevice(
            List<BorewellReadings> all
    ) {

        Map<String, BorewellReadings> latest =
                new HashMap<>();

        for (BorewellReadings reading : all) {

            String deviceId =
                    reading.getDeviceId();

            if (deviceId == null) {
                continue;
            }

            BorewellReadings current =
                    latest.get(deviceId);

            if (current == null) {
                latest.put(deviceId, reading);
                continue;
            }

            if (reading.getTimestamp() != null
                    && current.getTimestamp() != null
                    && reading.getTimestamp()
                    .isAfter(current.getTimestamp())) {

                latest.put(deviceId, reading);
            }
        }

        return new ArrayList<>(latest.values());
    }

    // =========================================================
    // LOCATION RESPONSE
    // =========================================================

    private Map<String, Object> locationToMap(
            BorewellReadings reading
    ) {

        Map<String, Object> location =
                new LinkedHashMap<>();

        location.put(
                "deviceId",
                reading.getDeviceId()
        );

        location.put(
                "village",
                reading.getVillage()
        );

        location.put(
                "district",
                reading.getDistrict()
        );

        /*
         * GPS coordinates are intentionally null.
         *
         * We currently have village + district in MySQL,
         * but we are not inventing latitude/longitude.
         *
         * Later the Government dashboard can geocode the
         * village/district or we can add a GPS table.
         */
        location.put("latitude", null);
        location.put("longitude", null);

        location.put(
                "waterLevel",
                reading.getWaterLevel()
        );

        location.put(
                "healthScore",
                reading.getHealthScore()
        );

        location.put(
                "anomalyScore",
                reading.getAnomalyScore()
        );

        location.put(
                "activeFault",
                reading.getActiveFault()
        );

        location.put(
                "conceptDriftDetected",
                reading.getConceptDriftDetected()
        );

        return location;
    }

    // =========================================================
    // BOREWELL RESPONSE
    // =========================================================

    private Map<String, Object> toMap(
            BorewellReadings reading
    ) {

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "deviceId",
                reading.getDeviceId()
        );

        result.put(
                "dt",
                reading.getDt()
        );

        result.put(
                "timestamp",
                reading.getTimestamp()
        );

        result.put(
                "village",
                reading.getVillage()
        );

        result.put(
                "district",
                reading.getDistrict()
        );

        result.put(
                "waterLevel",
                reading.getWaterLevel()
        );

        // Electrical telemetry
        result.put(
                "voltageRms",
                reading.getVoltageRms()
        );

        result.put(
                "currentRms",
                reading.getCurrentRms()
        );

        result.put(
                "powerFactor",
                reading.getPowerFactor()
        );

        result.put(
                "frequency",
                reading.getFrequency()
        );

        result.put(
                "unbalancePct",
                reading.getUnbalancePct()
        );

        // ML analytics
        result.put(
                "healthScore",
                reading.getHealthScore()
        );

        result.put(
                "anomalyScore",
                reading.getAnomalyScore()
        );

        result.put(
                "confidence",
                reading.getConfidence()
        );

        result.put(
                "dynamicThreshold",
                reading.getDynamicThreshold()
        );

        result.put(
                "activeFault",
                reading.getActiveFault()
        );

        result.put(
                "conceptDriftDetected",
                reading.getConceptDriftDetected()
        );

        return result;
    }

    // =========================================================
    // ALERT DETECTION
    // =========================================================

    private boolean hasAlert(
            BorewellReadings reading
    ) {

        /*
         * 1. Explicit ML fault
         */
        if (reading.getActiveFault() != null
                && !reading.getActiveFault().isBlank()
                && !reading.getActiveFault()
                .equalsIgnoreCase("NONE")
                && !reading.getActiveFault()
                .equalsIgnoreCase("[NONE]")) {

            return true;
        }

        /*
         * 2. Concept drift
         */
        if (Boolean.TRUE.equals(
                reading.getConceptDriftDetected()
        )) {
            return true;
        }

        /*
         * 3. Anomaly score above dynamic threshold
         */
        return reading.getAnomalyScore() != null
                && reading.getDynamicThreshold() != null
                && reading.getAnomalyScore()
                > reading.getDynamicThreshold();
    }

    // =========================================================
    // AVERAGE WATER LEVEL
    // =========================================================

    private double averageWaterLevel(
            List<BorewellReadings> readings
    ) {

        return readings
                .stream()
                .map(
                        BorewellReadings::getWaterLevel
                )
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    // =========================================================
    // AVERAGE HEALTH SCORE
    // =========================================================

    private double averageHealthScore(
            List<BorewellReadings> readings
    ) {

        return readings
                .stream()
                .map(
                        BorewellReadings::getHealthScore
                )
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }
}