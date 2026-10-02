# Neeldhaara / Aquora – MySQL Backend Package

This package contains the **database and backend components** developed for the **Aquora – Smart Borewell Health & Sustainability Management System**.

The component is responsible for receiving borewell telemetry through MQTT, processing and mapping the incoming data, and storing the readings in a MySQL database.

> **Note:** The MQTT simulator included with this component generates sample/demo telemetry for development and testing. These values do not represent live field sensor measurements.

---

# Package Contents

## 1. `Aquora-mysql-backend/`

Spring Boot backend responsible for:

* Connecting to the local MQTT broker
* Receiving borewell telemetry
* Processing and mapping incoming telemetry
* Storing telemetry readings in MySQL
* Maintaining borewell location information
* Providing the database-side foundation for dashboard integration

## 2. `mqtt-simulator/esp32_simulator.py`
Python-based MQTT simulator used to generate sample borewell telemetry for development and testing.
The simulator publishes telemetry using the following topic format:
aquora/<device_id>/telemetry
Example:
aquora/BW010/telemetry
The simulator generates data for multiple configured borewell devices, including:
* Borewell ID
* Farmer name
* Village
* District
* Latitude and longitude
* Pump information
* Water level
* RMS voltage
* RMS current
* Power factor
* Frequency
* Current unbalance
* FFT frequency
* Health score
* Anomaly score
* ML confidence
* Dynamic threshold
* Fault status
# Components Not Included
The following components are intentionally not included in this package:
* Java build output (`target/`)
* Python virtual environment (`venv/` or `.venv/`)
* Frontend application
* Mapbox frontend implementation
* Three.js / Digital Twin implementation
* Separate API/WebSocket implementation developed by other teammates
* AWS cloud deployment
These components are maintained separately as part of the complete Aquora system.
# System Architecture
The current development setup uses a local MQTT broker and local MySQL database.

──────────────────┐
│   MQTT Simulator / ESP32│
│                         │
│  Borewell Telemetry     │
└────────────┬────────────┘
             │
             │ MQTT
             ▼
┌─────────────────────────┐
│   Mosquitto MQTT Broker │
│       localhost:1883    │
└────────────┬────────────┘
             │
             │ aquora/+/telemetry
             ▼
┌─────────────────────────┐
│    Spring Boot Backend  │
│                         │
│  MQTT Subscriber        │
│  Telemetry Mapping      │
└────────────┬────────────┘
             │
             │ JPA / Hibernate
             ▼
┌─────────────────────────┐
│      MySQL Database     │
│       neeldhaara        │
│                         │
│   borewell_readings     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Dashboard / Mapbox /    │
│ Other System Components │
└─────────────────────────┘
# MQTT Configuration
The local MQTT broker uses:
Broker: tcp://localhost:1883
Port: 1883
The backend subscribes to:
aquora/+/telemetry
This allows the backend to receive telemetry from multiple borewell devices.
Example topics:
aquora/BW001/telemetry
aquora/BW002/telemetry
aquora/BW003/telemetry

