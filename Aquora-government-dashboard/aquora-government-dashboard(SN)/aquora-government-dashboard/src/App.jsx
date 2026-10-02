import { useEffect, useMemo, useState } from "react";
import KpiCard from "./components/KpiCard";
import BorewellMap from "./components/BorewellMap";
import { governmentApi } from "./services/api";
import {
  connectGovernmentWebSocket,
  disconnectGovernmentWebSocket
} from "./services/websocket";

function upsert(array, payload) {
  if (!payload?.deviceId) return array;

  const index = array.findIndex(
    x => x.deviceId === payload.deviceId
  );

  if (index < 0) {
    return [payload, ...array];
  }

  const next = [...array];
  next[index] = {
    ...next[index],
    ...payload
  };

  return next;
}

function getStatus(item) {
  const fault = String(
    item?.activeFault || ""
  ).toUpperCase();

  if (
    fault &&
    fault !== "NONE" &&
    fault !== "[NONE]"
  ) {
    return "CRITICAL";
  }

  if (item?.conceptDriftDetected === true) {
    return "WARNING";
  }

  const health = Number(item?.healthScore);
  const water = Number(item?.waterLevel);

  if (health < 0.4 || water < 20) {
    return "CRITICAL";
  }

  if (health < 0.7 || water < 35) {
    return "WARNING";
  }

  return "HEALTHY";
}

function healthPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }

  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function App() {

  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [borewells, setBorewells] = useState([]);
  const [trend, setTrend] = useState([]);

  const [ws, setWs] = useState(false);
  const [api, setApi] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // INITIAL REST DATA
  // ---------------------------------------------------------

  useEffect(() => {

    let alive = true;

    async function load() {

      try {

        const [
          summaryData,
          locationData,
          alertData,
          borewellData,
          trendData
        ] = await Promise.all([

          governmentApi.getSummary(),

          governmentApi
            .getLocations()
            .catch(() => []),

          governmentApi
            .getAlerts()
            .catch(() => []),

          governmentApi
            .getBorewells()
            .catch(() => []),

          governmentApi
            .getWaterLevelTrend()
            .catch(() => [])
        ]);

        if (!alive) return;

        setSummary(summaryData);

        setLocations(
          Array.isArray(locationData)
            ? locationData
            : []
        );

        setAlerts(
          Array.isArray(alertData)
            ? alertData
            : []
        );

        setBorewells(
          Array.isArray(borewellData)
            ? borewellData
            : []
        );

        setTrend(
          Array.isArray(trendData)
            ? trendData
            : []
        );

        setApi(true);

      } catch (error) {

        console.error(
          "Government API error:",
          error
        );

        setApi(false);

      } finally {

        if (alive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };

  }, []);

  // ---------------------------------------------------------
  // LIVE WEBSOCKET
  // ---------------------------------------------------------

  useEffect(() => {

    connectGovernmentWebSocket({

      onOpen: () => {
        setWs(true);
      },

      onClose: () => {
        setWs(false);
      },

      onError: () => {
        setWs(false);
      },

      onMessage: message => {

        /*
         * Actual backend sends the borewell reading directly:
         *
         * {
         *   deviceId,
         *   waterLevel,
         *   telemetry,
         *   mlAnalytics,
         *   ...
         * }
         *
         * It does NOT require type/payload.
         */

        const payload =
          message?.payload ?? message;

        if (!payload?.deviceId) {
          return;
        }

        setBorewells(
          current =>
            upsert(current, payload)
        );

        /*
         * Locations don't contain GPS yet,
         * but we can still keep device state
         * synchronized.
         */

        setLocations(
          current =>
            upsert(current, payload)
        );

        /*
         * If the live reading contains a fault,
         * add it to the alert list.
         */

        const fault = String(
          payload.activeFault || ""
        ).toUpperCase();

        const anomaly =
          Number(payload.anomalyScore);

        const threshold =
          Number(payload.dynamicThreshold);

        const drift =
          payload.conceptDriftDetected === true;

        const isAlert =
          (
            fault &&
            fault !== "NONE" &&
            fault !== "[NONE]"
          ) ||
          drift ||
          (
            Number.isFinite(anomaly) &&
            Number.isFinite(threshold) &&
            anomaly > threshold
          );

        if (isAlert) {

          setAlerts(current => {

            const alert = {
              deviceId: payload.deviceId,
              severity: getStatus(payload),
              message:
                payload.activeFault &&
                payload.activeFault !== "NONE"
                  ? payload.activeFault
                  : "Anomaly detected",
              timestamp:
                payload.timestamp || "Live"
            };

            return [
              alert,
              ...current.filter(
                x =>
                  x.deviceId !==
                  payload.deviceId
              )
            ].slice(0, 20);
          });
        }
      }
    });

    return () => {
      disconnectGovernmentWebSocket();
    };

  }, []);

  // ---------------------------------------------------------
  // TABLE DATA
  // ---------------------------------------------------------

  const rows = useMemo(() => {

    return borewells.length
      ? borewells
      : locations;

  }, [borewells, locations]);

  // ---------------------------------------------------------
  // STATUS COUNTS
  // ---------------------------------------------------------

  const healthy = rows.filter(
    x => getStatus(x) === "HEALTHY"
  ).length;

  const warning = rows.filter(
    x => getStatus(x) === "WARNING"
  ).length;

  const critical = rows.filter(
    x => getStatus(x) === "CRITICAL"
  ).length;

  return (

    <div className="dashboard">

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            🌱
          </div>

          <div>
            <h1>Neeldhaara</h1>
            <span>
              Smart Water | Better Tomorrow
            </span>
          </div>

        </div>

        <nav>

          {[
            "⌂ Dashboard",
            "◉ Borewells",
            "💧 Water Monitoring",
            "⚡ Grid & Pump Health",
            "⚠ Alerts",
            "📊 Analytics",
            "📍 Districts",
            "⚙ Settings"
          ].map((item, index) => (

            <div
              className={`nav-item ${
                index === 0 ? "active" : ""
              }`}
              key={item}
            >

              <span>
                {item.split(" ")[0]}
              </span>

              {item.substring(
                item.indexOf(" ") + 1
              )}

              {index === 4 && (

                <span className="nav-badge">
                  {summary?.activeAlerts ?? alerts.length}
                </span>

              )}

            </div>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <div
            className={
              ws
                ? "system-status"
                : "system-status offline"
            }
          >

            <span className="live-dot" />

            {ws
              ? "Live WebSocket"
              : "WebSocket Offline"}

          </div>

          <small>
            {api
              ? "REST API connected"
              : "REST API unavailable"}
          </small>

        </div>

      </aside>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <div>

            <h2>
              Government Overview
            </h2>

            <p>
              Borewell monitoring &
              groundwater intelligence
            </p>

          </div>

          <div className="header-right">

            <div className="location">
              📍 Maharashtra
            </div>

            <div
              className={
                ws
                  ? "live"
                  : "live disconnected"
              }
            >

              <span />

              {ws
                ? "LIVE"
                : "OFFLINE"}

            </div>

            <div className="profile">

              <div className="profile-avatar">
                GP
              </div>

              <div>

                <strong>
                  Government Portal
                </strong>

                <small>
                  Administrator
                </small>

              </div>

            </div>

          </div>

        </header>

        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <section className="kpi-grid">

          <KpiCard
            icon="💧"
            title="Total Borewells"
            value={
              summary?.totalBorewells ??
              "—"
            }
            subtitle="Monitoring active"
            tone="blue"
          />

          <KpiCard
            icon="🌱"
            title="Healthy Borewells"
            value={healthy}
            subtitle={`${warning} warning • ${critical} critical`}
            tone="green"
          />

          <KpiCard
            icon="⚠"
            title="Active Alerts"
            value={
              summary?.activeAlerts ??
              alerts.length
            }
            subtitle={`${critical} critical`}
            tone="yellow"
          />

          <KpiCard
            icon="📉"
            title="Average Water Level"
            value={
              summary?.averageWaterLevel != null
                ? Number(
                    summary.averageWaterLevel
                  ).toFixed(1)
                : "—"
            }
            subtitle="Current fleet average"
            tone="red"
          />

        </section>

        {/* ================================================= */}
        {/* MAP + ALERTS */}
        {/* ================================================= */}

        <section className="content-grid">

          <div className="card map-card">

            <div className="card-header">

              <div>

                <h3>
                  🌍 Borewell Monitoring Map
                </h3>

                <p>
                  Live infrastructure
                  locations and status
                </p>

              </div>

              <span className="map-count">
                {locations.length} locations
              </span>

            </div>

            <BorewellMap
              locations={locations}
            />

            <div className="map-legend">

              <span>
                <i className="legend-dot green" />
                Healthy
              </span>

              <span>
                <i className="legend-dot yellow" />
                Warning
              </span>

              <span>
                <i className="legend-dot red" />
                Critical
              </span>

            </div>

          </div>

          <div className="card alerts-card">

            <div className="card-header">

              <div>

                <h3>
                  🔔 Alerts & Notifications
                </h3>

                <p>
                  Latest system events
                </p>

              </div>

              <span className="alert-count">
                {alerts.length}
              </span>

            </div>

            <div className="alerts">

              {alerts.length === 0 ? (

                <div className="empty">
                  No active alerts
                </div>

              ) : (

                alerts.slice(0, 5).map(
                  (alert, index) => (

                    <div
                      className="alert-item"
                      key={`${alert.deviceId}-${index}`}
                    >

                      <div
                        className={`alert-icon ${
                          String(
                            alert.severity ||
                            "WARNING"
                          ).toLowerCase()
                        }`}
                      >
                        ⚠
                      </div>

                      <div className="alert-content">

                        <strong>
                          {alert.deviceId ||
                            "System alert"}
                        </strong>

                        <p>
                          {alert.message ||
                            alert.activeFault ||
                            "New event received"}
                        </p>

                        <small>
                          {alert.timestamp ||
                            "Live"}
                        </small>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* ANALYTICS */}
        {/* ================================================= */}

        <section className="analytics-grid">

          <div className="card chart-card">

            <div className="card-header">

              <div>

                <h3>
                  💧 Water Level Trend
                </h3>

                <p>
                  Backend-provided historical trend
                </p>

              </div>

              <span className="small-badge">
                {trend.length} readings
              </span>

            </div>

            <div className="chart-placeholder">

              {trend.length === 0 ? (

                <div className="chart-message">

                  <strong>
                    No trend data
                  </strong>

                  <span>
                    Waiting for readings.
                  </span>

                </div>

              ) : (

                <div className="chart-message">

                  <strong>
                    Water-level data loaded
                  </strong>

                  <span>
                    {trend.length} readings
                    available from backend.
                  </span>

                </div>

              )}

            </div>

          </div>

          <div className="card health-card">

            <div className="card-header">

              <div>

                <h3>
                  🌱 Borewell Health
                </h3>

                <p>
                  Current fleet status
                </p>

              </div>

            </div>

            <div className="health-circle">

              <div>

                <strong>

                  {rows.length
                    ? `${(
                        (healthy /
                          rows.length) *
                        100
                      ).toFixed(1)}%`
                    : "—"}

                </strong>

                <span>
                  Healthy
                </span>

              </div>

            </div>

            <div className="health-stats">

              <div>

                <span className="dot green" />

                Healthy

                <strong>
                  {healthy}
                </strong>

              </div>

              <div>

                <span className="dot yellow" />

                Warning

                <strong>
                  {warning}
                </strong>

              </div>

              <div>

                <span className="dot red" />

                Critical

                <strong>
                  {critical}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* BOREWELL TABLE */}
        {/* ================================================= */}

        <section className="card table-card">

          <div className="card-header">

            <div>

              <h3>
                📊 Borewell Status
              </h3>

              <p>
                Latest monitored infrastructure
              </p>

            </div>

            <span className="small-badge">
              {rows.length} rows
            </span>

          </div>

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Device
                  </th>

                  <th>
                    Water Level
                  </th>

                  <th>
                    Health Score
                  </th>

                  <th>
                    Anomaly
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Fault
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty"
                    >
                      Loading...
                    </td>

                  </tr>

                ) : rows.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty"
                    >
                      No borewell data
                    </td>

                  </tr>

                ) : (

                  rows.slice(0, 10).map(
                    borewell => {

                      const status =
                        getStatus(
                          borewell
                        );

                      return (

                        <tr
                          key={
                            borewell.deviceId
                          }
                        >

                          <td>
                            <strong>
                              {
                                borewell.deviceId
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              borewell.waterLevel != null
                                ? `${Number(
                                    borewell.waterLevel
                                  ).toFixed(2)}`
                                : "—"
                            }
                          </td>

                          <td>
                            {
                              healthPercent(
                                borewell.healthScore
                              )
                            }
                          </td>

                          <td>
                            {
                              borewell.anomalyScore != null
                                ? Number(
                                    borewell.anomalyScore
                                  ).toFixed(4)
                                : "—"
                            }
                          </td>

                          <td>

                            <span
                              className={`status ${
                                status.toLowerCase()
                              }`}
                            >

                              <span className="status-dot" />

                              {status}

                            </span>

                          </td>

                          <td>

                            {borewell.activeFault &&
                            borewell.activeFault !==
                              "NONE"
                              ? borewell.activeFault
                              : "—"}

                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}