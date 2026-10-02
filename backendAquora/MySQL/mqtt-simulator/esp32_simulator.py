import json
import time
import random
from datetime import datetime

import paho.mqtt.client as mqtt


# ============================================================
# AQUORA ESP32 SIMULATOR
# ============================================================

MQTT_BROKER = "localhost"
MQTT_PORT = 1883

MQTT_QOS = 1
PUBLISH_INTERVAL = 10


# ============================================================
# BOREWELL MASTER DATA
# Demo data for Mapbox / frontend prototype
# ============================================================

BOREWELLS = {
    "BW001": {
        "farmer_name": "Ramesh Patil",
        "village": "Karmad",
        "taluka": "Chhatrapati Sambhajinagar",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 19.9500,
        "longitude": 75.3500,
        "pump_type": "Submersible",
        "motor_rating_hp": 5,
        "borewell_depth_m": 180,
        "installation_year": 2022
    },

    "BW002": {
        "farmer_name": "Suresh Shinde",
        "village": "Waluj",
        "taluka": "Gangapur",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 19.8350,
        "longitude": 75.2200,
        "pump_type": "Submersible",
        "motor_rating_hp": 7.5,
        "borewell_depth_m": 210,
        "installation_year": 2021
    },

    "BW003": {
        "farmer_name": "Sunil Jadhav",
        "village": "Chitegaon",
        "taluka": "Paithan",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 19.7000,
        "longitude": 75.3000,
        "pump_type": "Submersible",
        "motor_rating_hp": 5,
        "borewell_depth_m": 160,
        "installation_year": 2023
    },

    "BW004": {
        "farmer_name": "Ganesh Pawar",
        "village": "Shendra",
        "taluka": "Chhatrapati Sambhajinagar",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 19.9200,
        "longitude": 75.7000,
        "pump_type": "Submersible",
        "motor_rating_hp": 10,
        "borewell_depth_m": 230,
        "installation_year": 2020
    },

    "BW005": {
        "farmer_name": "Vijay More",
        "village": "Bidkin",
        "taluka": "Paithan",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 19.5500,
        "longitude": 75.2300,
        "pump_type": "Submersible",
        "motor_rating_hp": 5,
        "borewell_depth_m": 150,
        "installation_year": 2022
    },

    "BW006": {
        "farmer_name": "Mahesh Deshmukh",
        "village": "Jalna",
        "taluka": "Jalna",
        "district": "Jalna",
        "state": "Maharashtra",
        "latitude": 19.8347,
        "longitude": 75.8816,
        "pump_type": "Submersible",
        "motor_rating_hp": 7.5,
        "borewell_depth_m": 200,
        "installation_year": 2021
    },

    "BW007": {
        "farmer_name": "Dattatray Wagh",
        "village": "Ambad",
        "taluka": "Ambad",
        "district": "Jalna",
        "state": "Maharashtra",
        "latitude": 19.6130,
        "longitude": 75.7970,
        "pump_type": "Submersible",
        "motor_rating_hp": 5,
        "borewell_depth_m": 175,
        "installation_year": 2023
    },

    "BW008": {
        "farmer_name": "Prakash Rathod",
        "village": "Bhokardan",
        "taluka": "Bhokardan",
        "district": "Jalna",
        "state": "Maharashtra",
        "latitude": 20.2650,
        "longitude": 75.7680,
        "pump_type": "Submersible",
        "motor_rating_hp": 10,
        "borewell_depth_m": 240,
        "installation_year": 2020
    },

    "BW009": {
        "farmer_name": "Nitin Gaikwad",
        "village": "Sillod",
        "taluka": "Sillod",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 20.3000,
        "longitude": 75.6500,
        "pump_type": "Submersible",
        "motor_rating_hp": 5,
        "borewell_depth_m": 165,
        "installation_year": 2022
    },

    "BW010": {
        "farmer_name": "Rahul Khandare",
        "village": "Kannad",
        "taluka": "Kannad",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "latitude": 20.2600,
        "longitude": 75.1300,
        "pump_type": "Submersible",
        "motor_rating_hp": 7.5,
        "borewell_depth_m": 190,
        "installation_year": 2021
    }
}


# ============================================================
# MQTT CLIENT
# ============================================================

client = mqtt.Client()


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("========================================")
        print("Connected to MQTT broker")
        print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
        print("========================================")
    else:
        print(f"MQTT connection failed. Return code: {rc}")


client.on_connect = on_connect


# ============================================================
# GENERATE SENSOR + ML READING
# ============================================================

def generate_reading(device_id):

    borewell = BOREWELLS[device_id]

    # --------------------------------------------------------
    # NORMAL SENSOR VALUES
    # --------------------------------------------------------

    water_level = round(random.uniform(35.0, 100.0), 2)

    voltage_rms = round(random.uniform(218.0, 232.0), 2)

    current_rms = round(random.uniform(4.0, 10.0), 2)

    power_factor = round(random.uniform(0.78, 0.95), 2)

    frequency = round(random.uniform(49.5, 50.5), 2)

    unbalance_pct = round(random.uniform(0.5, 4.0), 2)

    # MCSA / FFT frequency
    fft_frequency = round(
        random.uniform(49.0, 51.0),
        2
    )

    health_score = round(
        random.uniform(0.75, 0.98),
        4
    )

    anomaly_score = round(
        random.uniform(0.05, 0.30),
        4
    )

    confidence = round(
        random.uniform(0.85, 0.99),
        2
    )

    dynamic_threshold = round(
        random.uniform(0.70, 0.90),
        4
    )

    fault = "NONE"


    # --------------------------------------------------------
    # RANDOM FAULT SIMULATION
    # --------------------------------------------------------

    fault_probability = random.random()


    # DRY RUN
    if fault_probability < 0.03:

        fault = "DRY_RUN"

        water_level = round(
            random.uniform(5.0, 20.0),
            2
        )

        current_rms = round(
            random.uniform(1.5, 3.0),
            2
        )

        health_score = round(
            random.uniform(0.20, 0.45),
            4
        )

        anomaly_score = round(
            random.uniform(0.70, 0.95),
            4
        )

        confidence = round(
            random.uniform(0.90, 0.99),
            2
        )


    # OVERLOAD
    elif fault_probability < 0.06:

        fault = "OVERLOAD"

        current_rms = round(
            random.uniform(12.0, 18.0),
            2
        )

        health_score = round(
            random.uniform(0.20, 0.50),
            4
        )

        anomaly_score = round(
            random.uniform(0.65, 0.95),
            4
        )

        confidence = round(
            random.uniform(0.90, 0.99),
            2
        )


    # ABNORMAL PUMP
    elif fault_probability < 0.09:

        fault = "ABNORMAL_PUMP"

        current_rms = round(
            random.uniform(10.0, 14.0),
            2
        )

        unbalance_pct = round(
            random.uniform(6.0, 12.0),
            2
        )

        fft_frequency = round(
            random.uniform(45.0, 55.0),
            2
        )

        health_score = round(
            random.uniform(0.30, 0.60),
            4
        )

        anomaly_score = round(
            random.uniform(0.60, 0.90),
            4
        )

        confidence = round(
            random.uniform(0.85, 0.98),
            2
        )


    # --------------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------------

    timestamp = datetime.now().strftime(
        "%Y%m%dT%H%M%S"
    )

    dt = f"{device_id}_{timestamp}"


    # --------------------------------------------------------
    # COMPLETE PAYLOAD
    # --------------------------------------------------------

    payload = {

        # ====================================================
        # BOREWELL IDENTITY
        # ====================================================

        "device_id": device_id,

        "dt": dt,


        # ====================================================
        # FARMER / LOCATION INFORMATION
        # ====================================================

        "borewell": {

            "borewell_id": device_id,

            "farmer_name": borewell["farmer_name"],

            "village": borewell["village"],

            "taluka": borewell["taluka"],

            "district": borewell["district"],

            "state": borewell["state"],

            "latitude": borewell["latitude"],

            "longitude": borewell["longitude"]
        },


        # ====================================================
        # PUMP INFORMATION
        # ====================================================

        "pump": {

            "pump_type": borewell["pump_type"],

            "motor_rating_hp": borewell["motor_rating_hp"],

            "borewell_depth_m": borewell["borewell_depth_m"],

            "installation_year": borewell["installation_year"]
        },


        # ====================================================
        # WATER INFORMATION
        # ====================================================

        "water": {

            "water_level": water_level,

            "water_level_unit": "percent"
        },


        # ====================================================
        # SENSOR TELEMETRY
        # ====================================================

        "telemetry": {

            "current_rms": current_rms,

            "voltage_rms": voltage_rms,

            "power_factor": power_factor,

            "frequency": frequency,

            "unbalance_pct": unbalance_pct,

            "fft_frequency": fft_frequency
        },


        # ====================================================
        # ML ANALYTICS
        # ====================================================

        "ml_analytics": {

            "health_score": health_score,

            "anomaly_score": anomaly_score,

            "confidence": confidence,

            "dynamic_threshold": dynamic_threshold,

            "fault": fault
        }

    }


    return payload


# ============================================================
# START SIMULATOR
# ============================================================

try:

    print("========================================")
    print("       AQUORA ESP32 SIMULATOR")
    print("========================================")

    print(
        f"Connecting to MQTT broker..."
    )

    print(
        f"Broker: {MQTT_BROKER}:{MQTT_PORT}"
    )

    print()

    # Connect to Mosquitto
    client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        60
    )

    client.loop_start()

    print("Simulator started.")

    print(
        f"Publishing every {PUBLISH_INTERVAL} seconds..."
    )

    print(
        f"Total borewells: {len(BOREWELLS)}"
    )

    print()


    # ========================================================
    # CONTINUOUS PUBLISHING
    # ========================================================

    while True:

        for device_id in BOREWELLS:

            payload = generate_reading(
                device_id
            )

            topic = (
                f"aquora/"
                f"{device_id}/"
                f"telemetry"
            )

            message = json.dumps(
                payload
            )


            # ------------------------------------------------
            # MQTT PUBLISH
            # ------------------------------------------------

            result = client.publish(
                topic,
                message,
                qos=MQTT_QOS
            )


            # ------------------------------------------------
            # CONSOLE OUTPUT
            # ------------------------------------------------

            if result.rc == mqtt.MQTT_ERR_SUCCESS:

                print("----------------------------------------")

                print(
                    f"Borewell : "
                    f"{device_id}"
                )

                print(
                    f"Farmer   : "
                    f"{payload['borewell']['farmer_name']}"
                )

                print(
                    f"Village  : "
                    f"{payload['borewell']['village']}"
                )

                print(
                    f"District : "
                    f"{payload['borewell']['district']}"
                )

                print(
                    f"Location : "
                    f"{payload['borewell']['latitude']}, "
                    f"{payload['borewell']['longitude']}"
                )

                print(
                    f"Water    : "
                    f"{payload['water']['water_level']}%"
                )

                print(
                    f"Current  : "
                    f"{payload['telemetry']['current_rms']} A"
                )

                print(
                    f"Voltage  : "
                    f"{payload['telemetry']['voltage_rms']} V"
                )

                print(
                    f"Frequency: "
                    f"{payload['telemetry']['frequency']} Hz"
                )

                print(
                    f"FFT Freq : "
                    f"{payload['telemetry']['fft_frequency']} Hz"
                )

                print(
                    f"Health   : "
                    f"{payload['ml_analytics']['health_score']}"
                )

                print(
                    f"Anomaly  : "
                    f"{payload['ml_analytics']['anomaly_score']}"
                )

                print(
                    f"Fault    : "
                    f"{payload['ml_analytics']['fault']}"
                )

                print(
                    f"Confidence: "
                    f"{payload['ml_analytics']['confidence']}"
                )

                print(
                    f"Time     : "
                    f"{payload['dt']}"
                )

            else:

                print(
                    f"Failed to publish "
                    f"data for {device_id}"
                )


        print()

        print(
            f"Waiting "
            f"{PUBLISH_INTERVAL} seconds..."
        )

        print()

        time.sleep(
            PUBLISH_INTERVAL
        )


# ============================================================
# STOP SIMULATOR
# ============================================================

except KeyboardInterrupt:

    print()

    print("========================================")

    print("Simulator stopped.")

    print("========================================")

    client.loop_stop()

    client.disconnect()