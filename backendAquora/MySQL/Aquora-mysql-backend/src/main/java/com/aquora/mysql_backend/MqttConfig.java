package com.aquora.mysql_backend;

import java.time.LocalDateTime;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.aquora.mysql_backend.entity.BorewellReadings;
import com.aquora.mysql_backend.repository.BorewellReadingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Configuration
public class MqttConfig {

    @Value("${mqtt.broker}")
    private String broker;

    @Value("${mqtt.topic}")
    private String topic;

    @Value("${mqtt.client-id}")
    private String clientId;

    private final BorewellReadingRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MqttClient mqttClient;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    public MqttConfig(BorewellReadingRepository repository) {
        this.repository = repository;
    }


    // ============================================================
    // START MQTT
    // ============================================================

    @PostConstruct
    public void startMqtt() {

        try {

            System.out.println("==============================================");
            System.out.println("        AQUORA MQTT BACKEND STARTING");
            System.out.println("==============================================");

            System.out.println("MQTT Broker : " + broker);
            System.out.println("MQTT Topic  : " + topic);
            System.out.println("Client ID   : " + clientId);

            mqttClient = new MqttClient(broker, clientId);

            MqttConnectOptions options = new MqttConnectOptions();

            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);

            mqttClient.connect(options);

            System.out.println("MQTT CONNECTED SUCCESSFULLY");

            mqttClient.subscribe(topic, 1, this::handleMessage);

            System.out.println("MQTT SUBSCRIBED TO: " + topic);

            System.out.println("==============================================");

        } catch (Exception e) {

            System.err.println("MQTT STARTUP ERROR");
            e.printStackTrace();
        }
    }


    // ============================================================
    // HANDLE MQTT MESSAGE
    // ============================================================

    private void handleMessage(
            String receivedTopic,
            MqttMessage mqttMessage
    ) {

        try {

            String payload = new String(mqttMessage.getPayload());

            System.out.println();
            System.out.println("==============================================");
            System.out.println("        NEW AQUORA MQTT MESSAGE");
            System.out.println("==============================================");

            System.out.println("Topic:");
            System.out.println(receivedTopic);

            System.out.println();
            System.out.println("Payload:");
            System.out.println(payload);


            // ====================================================
            // PARSE JSON
            // ====================================================

            JsonNode json = objectMapper.readTree(payload);

            BorewellReadings reading = new BorewellReadings();


            // ====================================================
            // DEVICE INFORMATION
            // ====================================================

            if (json.has("device_id")) {

                reading.setDeviceId(
                        json.get("device_id").asText()
                );
            }

            if (json.has("dt")) {

                reading.setDt(
                        json.get("dt").asText()
                );
            }


            // ====================================================
            // TIMESTAMP
            // ====================================================

            if (json.has("timestamp")) {

                try {

                    reading.setTimestamp(
                            LocalDateTime.parse(
                                    json.get("timestamp").asText()
                            )
                    );

                } catch (Exception e) {

                    reading.setTimestamp(
                            LocalDateTime.now()
                    );
                }

            } else {

                reading.setTimestamp(
                        LocalDateTime.now()
                );
            }


            // ====================================================
            // BOREWELL INFORMATION
            // ====================================================

            JsonNode borewell = json.get("borewell");

            if (borewell != null && !borewell.isNull()) {

                // District
                if (borewell.has("district")) {

                    reading.setDistrict(
                            borewell.get("district").asText()
                    );
                }

                // Village
                if (borewell.has("village")) {

                    reading.setVillage(
                            borewell.get("village").asText()
                    );
                }

                // Latitude
                if (borewell.has("latitude")) {

                    reading.setLatitude(
                            borewell.get("latitude").asDouble()
                    );
                }

                // Longitude
                if (borewell.has("longitude")) {

                    reading.setLongitude(
                            borewell.get("longitude").asDouble()
                    );
                }
            }


            // ====================================================
            // WATER INFORMATION
            // ====================================================

            JsonNode water = json.get("water");

            if (water != null && !water.isNull()) {

                if (water.has("water_level")) {

                    reading.setWaterLevel(
                            water.get("water_level").asDouble()
                    );
                }
            }


            // ====================================================
            // TELEMETRY
            // ====================================================

            JsonNode telemetry = json.get("telemetry");

            if (telemetry != null && !telemetry.isNull()) {

                // Current RMS
                if (telemetry.has("current_rms")) {

                    reading.setCurrentRms(
                            telemetry.get("current_rms").asDouble()
                    );
                }

                // Voltage RMS
                if (telemetry.has("voltage_rms")) {

                    reading.setVoltageRms(
                            telemetry.get("voltage_rms").asDouble()
                    );
                }

                // Power Factor
                if (telemetry.has("power_factor")) {

                    reading.setPowerFactor(
                            telemetry.get("power_factor").asDouble()
                    );
                }

                // Frequency
                if (telemetry.has("frequency")) {

                    reading.setFrequency(
                            telemetry.get("frequency").asDouble()
                    );
                }

                // Unbalance
                if (telemetry.has("unbalance_pct")) {

                    reading.setUnbalancePct(
                            telemetry.get("unbalance_pct").asDouble()
                    );
                }
            }


            // ====================================================
            // ML ANALYTICS
            // ====================================================

            JsonNode mlAnalytics = json.get("ml_analytics");

            if (mlAnalytics != null && !mlAnalytics.isNull()) {

                // Health Score
                if (mlAnalytics.has("health_score")) {

                    reading.setHealthScore(
                            mlAnalytics.get("health_score").asDouble()
                    );
                }

                // Anomaly Score
                if (mlAnalytics.has("anomaly_score")) {

                    reading.setAnomalyScore(
                            mlAnalytics.get("anomaly_score").asDouble()
                    );
                }

                // Confidence
                if (mlAnalytics.has("confidence")) {

                    reading.setConfidence(
                            mlAnalytics.get("confidence").asDouble()
                    );
                }

                // Dynamic Threshold
                if (mlAnalytics.has("dynamic_threshold")) {

                    reading.setDynamicThreshold(
                            mlAnalytics.get("dynamic_threshold").asDouble()
                    );
                }


                // ====================================================
                // FAULT
                // ====================================================

                /*
                 * Current simulator format:
                 *
                 * "fault": "NONE"
                 *
                 * Also supports older format:
                 *
                 * "active_faults": ["DRY_RUN"]
                 */

                if (mlAnalytics.has("fault")) {

                    JsonNode faultNode =
                            mlAnalytics.get("fault");

                    if (!faultNode.isNull()) {

                        reading.setActiveFault(
                                faultNode.asText()
                        );
                    }

                } else if (mlAnalytics.has("active_faults")) {

                    JsonNode faults =
                            mlAnalytics.get("active_faults");

                    if (faults.isArray() && faults.size() > 0) {

                        reading.setActiveFault(
                                faults.get(0).asText()
                        );

                    } else {

                        reading.setActiveFault("NONE");
                    }
                }
            }


            // ====================================================
            // CONCEPT DRIFT
            // ====================================================

            if (json.has("concept_drift_detected")) {

                reading.setConceptDriftDetected(
                        json.get("concept_drift_detected").asBoolean()
                );

            } else if (
                    mlAnalytics != null
                    && mlAnalytics.has("concept_drift_detected")
            ) {

                reading.setConceptDriftDetected(
                        mlAnalytics
                                .get("concept_drift_detected")
                                .asBoolean()
                );
            }


            // ====================================================
            // PRINT PARSED DATA
            // ====================================================

            System.out.println();
            System.out.println("----------- PARSED AQUORA DATA -----------");

            System.out.println("Device ID   : "
                    + reading.getDeviceId());

            System.out.println("DT          : "
                    + reading.getDt());

            System.out.println("District    : "
                    + reading.getDistrict());

            System.out.println("Village     : "
                    + reading.getVillage());

            System.out.println("Latitude    : "
                    + reading.getLatitude());

            System.out.println("Longitude   : "
                    + reading.getLongitude());

            System.out.println("Water Level : "
                    + reading.getWaterLevel());

            System.out.println("Voltage RMS : "
                    + reading.getVoltageRms());

            System.out.println("Current RMS : "
                    + reading.getCurrentRms());

            System.out.println("Power Factor: "
                    + reading.getPowerFactor());

            System.out.println("Frequency   : "
                    + reading.getFrequency());

            System.out.println("Unbalance   : "
                    + reading.getUnbalancePct());

            System.out.println("Health Score: "
                    + reading.getHealthScore());

            System.out.println("Anomaly     : "
                    + reading.getAnomalyScore());

            System.out.println("Confidence  : "
                    + reading.getConfidence());

            System.out.println("Threshold   : "
                    + reading.getDynamicThreshold());

            System.out.println("Fault       : "
                    + reading.getActiveFault());

            System.out.println("Drift       : "
                    + reading.getConceptDriftDetected());


            // ====================================================
            // SAVE TO MYSQL
            // ====================================================

            BorewellReadings saved =
                    repository.save(reading);


            System.out.println();
            System.out.println("----------- MYSQL SAVE SUCCESS -----------");

            System.out.println("Database ID  : "
                    + saved.getId());

            System.out.println("Device ID    : "
                    + saved.getDeviceId());

            System.out.println("District     : "
                    + saved.getDistrict());

            System.out.println("Village      : "
                    + saved.getVillage());

            System.out.println("Latitude     : "
                    + saved.getLatitude());

            System.out.println("Longitude    : "
                    + saved.getLongitude());

            System.out.println("Water Level  : "
                    + saved.getWaterLevel());

            System.out.println("Fault        : "
                    + saved.getActiveFault());

            System.out.println("==============================================");
            System.out.println();

        } catch (Exception e) {

            System.err.println();
            System.err.println("==============================================");
            System.err.println("ERROR PROCESSING MQTT MESSAGE");
            System.err.println("==============================================");

            e.printStackTrace();
        }
    }
}