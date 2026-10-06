"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity, Bell, ChevronDown, ChevronRight, CircleDollarSign, CloudSun, Droplets,
  FileText, Gauge, Home, Leaf, MapPin, Menu, Radio, Settings, Tractor,
  Waves, X, Zap, Sun, CheckCircle2
} from "lucide-react";
import { demoWaterHistory, farmerProfile, mlPayload } from "../lib/sampleData";
import PumpModel from "../components/PumpModel";

const navItems = [
  { label: "Home", icon: Home, href: "#home" },
  { label: "My Farm", icon: Tractor, href: "#farm" },
  { label: "Soil & Water", icon: Droplets, href: "#telemetry" },
  { label: "Weather", icon: CloudSun, href: "#weather" },
  { label: "Crop Advisory", icon: Leaf, href: "#insights" },
  { label: "Market Price", icon: CircleDollarSign, href: "#market" },
  { label: "Reports", icon: FileText, href: "#reports" },
  { label: "Settings", icon: Settings, href: "#settings" },
];

function StatusCard({ icon: Icon, title, value, note, tone }: any) {
  return (
    <article className={`status-card ${tone}`}>
      <div className="status-icon">
        <Icon size={29} strokeWidth={1.7} />
      </div>

      <div className="status-copy">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function FarmScene() {
  const faults = mlPayload.ml_analytics.active_faults.filter(
    (x) => x !== "NONE"
  );

  return (
    <section className="card farm-card" id="farm">
      <div className="farm-photo">

        {/* SMALL DIGITAL TWIN */}
        <div
          style={{
            position: "absolute",
            top: "55px",
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            borderRadius: "inherit",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "161.3%",
              height: "161.3%",
              transform: "scale(0.62)",
              transformOrigin: "top left",
            }}
          >
            <PumpModel />
          </div>
        </div>

        <div
          className="farm-photo-title"
          style={{
            position: "relative",
            zIndex: 10,
          }}
        >
          <MapPin size={17} fill="currentColor" />
          <span>Your Farm</span>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 10,
          }}
        >
          <div className="dynamic-water-label">
            <Droplets size={15} />
            <span>
              Water Table
              <br />
              <b>~ {mlPayload.water_level.toFixed(1)} m</b>
            </span>
          </div>

          <div className={`farm-live ${faults.length ? "fault" : ""}`}>
            {faults.length ? (
              <Radio size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}

            {faults.length
              ? faults.join(", ")
              : "Borewell monitoring active"}
          </div>

          <Link
            href="/digital-twin"
            className="digital-twin-pill"
          >
            <Gauge size={15} />
            Digital Twin
            <ChevronRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}

function WaterChart() {
  const vals = demoWaterHistory;
  const min = 22;
  const max = 28;

  const pts = vals
    .map(
      (v, i) =>
        `${30 + i * 88},${145 - ((v - min) / (max - min)) * 100}`
    )
    .join(" ");

  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 640 180"
        preserveAspectRatio="none"
        className="water-chart"
      >
        {[22, 24, 26, 28].map((n) => {
          const y = 145 - ((n - min) / (max - min)) * 100;

          return (
            <g key={n}>
              <line
                x1="30"
                x2="620"
                y1={y}
                y2={y}
                className="grid-line"
              />
              <text x="0" y={y + 4}>
                {n} m
              </text>
            </g>
          );
        })}

        <polyline points={pts} className="chart-line" />

        {vals.map((v, i) => {
          const x = 30 + i * 88;
          const y = 145 - ((v - min) / (max - min)) * 100;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              className="chart-dot"
            />
          );
        })}

        <rect
          x="557"
          y="48"
          width="62"
          height="27"
          rx="8"
          className="chart-pill"
        />

        <text x="567" y="66" className="pill-text">
          {mlPayload.water_level.toFixed(1)} m
        </text>

        {[
          "22 Sep",
          "23 Sep",
          "24 Sep",
          "25 Sep",
          "26 Sep",
          "27 Sep",
          "28 Sep",
        ].map((d, i) => (
          <text
            key={d}
            x={i * 88 + 9}
            y="172"
          >
            {d}
          </text>
        ))}
      </svg>

      <p className="demo-note">
        Illustrative history for the chart layout. Current reading is always{" "}
        <b>{mlPayload.water_level.toFixed(1)} m</b> from the current payload.
      </p>
    </div>
  );
}

function Advisory() {
  const m = mlPayload.ml_analytics;

  const faults = m.active_faults.filter(
    (x) => x !== "NONE"
  );

  return (
    <section className="card advisory-card" id="insights">
      <div className="section-head compact">
        <div>
          <span className="eyebrow">
            <Leaf size={16} /> AQUORA SAYS
          </span>

          <h2>
            {faults.length
              ? "Check your borewell"
              : "One thing to know"}
          </h2>
        </div>
      </div>

      <div className="advice-main">
        <div className="advice-icon">
          <Leaf size={26} />
        </div>

        <p>
          {faults.length
            ? `Active fault: ${faults.join(
                ", "
              )}. Review the borewell status.`
            : `Your borewell is operating normally. Water level is ${mlPayload.water_level.toFixed(
                1
              )} m and ML confidence is ${(m.confidence * 100).toFixed(
                0
              )}%.`}
        </p>
      </div>

      <div className="advice-list">
        <span>
          <CheckCircle2 />
          {faults.length
            ? "Active fault reported by ML"
            : "No immediate action needed"}
        </span>

        <span>
          <CheckCircle2 />
          Concept drift:{" "}
          {m.concept_drift_detected
            ? "Detected"
            : "Not detected"}
        </span>

        <span>
          <CheckCircle2 />
          {faults.length
            ? faults.join(", ")
            : "Pump/borewell status is normal"}
        </span>
      </div>

      <div className="keep-growing">
        Keep growing! <Leaf size={15} />
      </div>
    </section>
  );
}

function WeatherCard() {
  return (
    <section className="card weather-card" id="weather">
      <div className="weather-head">
        <span>Today's Weather</span>

        <div className="weather-temp">
          <Sun size={31} />
          <strong>{farmerProfile.temperature}</strong>
          <small>{farmerProfile.weatherLabel}</small>
        </div>
      </div>

      <div className="weather-stats">
        <div>
          <span>Humidity</span>
          <b>62%</b>
        </div>

        <div>
          <span>Wind Speed</span>
          <b>8 km/h</b>
        </div>

        <div>
          <span>Rain Chance</span>
          <b>0%</b>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      href: "/digital-twin",
      icon: Gauge,
      label: (
        <>
          Digital
          <br />
          Twin
        </>
      ),
    },
    {
      href: "#farm",
      icon: MapPin,
      label: (
        <>
          Borewell
          <br />
          Details
        </>
      ),
    },
    {
      href: "#telemetry",
      icon: Droplets,
      label: (
        <>
          Water
          <br />
          Status
        </>
      ),
    },
    {
      href: "#reports",
      icon: FileText,
      label: <>Reports</>,
    },
  ];

  return (
    <section className="card quick-card">
      <div className="section-head compact">
        <div>
          <span className="eyebrow">QUICK ACTIONS</span>
          <h2>Useful shortcuts</h2>
        </div>
      </div>

      <div className="quick-grid">
        {actions.map(
          ({ href, icon: Icon, label }) => (
            <Link href={href} key={href}>
              <Icon />
              <span>{label}</span>
            </Link>
          )
        )}
      </div>
    </section>
  );
}

function Telemetry() {
  const t = mlPayload.telemetry;

  const rows = [
    [Zap, "Voltage", `${t.voltage_rms} V`, "amber"],
    [Activity, "Current", `${t.current_rms} A`, "green"],
    [Gauge, "Power Factor", t.power_factor, "blue"],
    [Waves, "Frequency", `${t.frequency} Hz`, "blue"],
    [Activity, "Unbalance", `${t.unbalance_pct}%`, "green"],
  ];

  return (
    <section className="card telemetry-card" id="telemetry">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            <Activity size={15} /> ELECTRICAL TELEMETRY
          </span>
          <h2>Current borewell readings</h2>
        </div>

        <span className="live-small">
          <i /> LIVE
        </span>
      </div>

      <div className="telemetry-grid">
        {rows.map(
          ([Icon, label, value, tone]: any) => (
            <div
              className={`telemetry-item ${tone}`}
              key={label}
            >
              <div className="telemetry-icon">
                <Icon size={18} />
              </div>

              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function MlAnalytics() {
  const m = mlPayload.ml_analytics;

  return (
    <section className="card ml-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            <Radio size={15} /> ML ANALYTICS
          </span>
          <h2>Model output</h2>
        </div>

        <span className="payload-id">
          {mlPayload.device_id}
        </span>
      </div>

      <div className="ml-grid">
        <div>
          <span>Health Score</span>
          <b>{m.health_score}</b>
        </div>

        <div>
          <span>Anomaly Score</span>
          <b>{m.anomaly_score}</b>
        </div>

        <div>
          <span>Confidence</span>
          <b>{(m.confidence * 100).toFixed(0)}%</b>
        </div>

        <div>
          <span>Dynamic Threshold</span>
          <b>{m.dynamic_threshold}</b>
        </div>

        <div>
          <span>Active Fault</span>
          <b>{m.active_faults.join(", ")}</b>
        </div>

        <div>
          <span>Concept Drift</span>
          <b>
            {m.concept_drift_detected
              ? "Detected"
              : "Not detected"}
          </b>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [open, setOpen] = useState(false);

  const t = mlPayload.telemetry;
  const m = mlPayload.ml_analytics;

  const faults = m.active_faults.filter(
    (x) => x !== "NONE"
  );

  const systemStatus = faults.length
    ? "Attention"
    : "Monitoring";

  return (
    <main className="app-shell" id="home">
      <aside
        className={`sidebar ${open ? "open" : ""}`}
      >
        <div className="brand">
          <div className="brand-mark">
            <Droplets size={27} />
            <Leaf size={19} />
          </div>

          <div>
            <b>Neeldhara</b>
            <span>Every drop. Every field.</span>
          </div>
        </div>

        <button
          className="mobile-close"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>

        <nav>
          {navItems.map(
            ({ label, icon: Icon, href }, i) => (
              <a
                key={label}
                href={href}
                className={`nav-item ${
                  i === 0 ? "active" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </a>
            )
          )}

          <Link
            href="/digital-twin"
            className="nav-item twin-nav"
          >
            <Gauge size={20} />
            <span>Digital Twin</span>
            <span className="new-badge">LIVE</span>
          </Link>
        </nav>

        <div className="sidebar-art">
          <img
            src="/assets/farmer-sidebar.jpg"
            alt="Farmer working in a field"
          />
        </div>
      </aside>

      <section className="content">
        <section className="hero">
          <div className="hero-photo" />

          <header className="topbar">
            <button
              className="menu-btn"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>

            <div className="greeting">
              <div className="sun-orb">
                <Sun size={28} />
              </div>

              <div>
                <h1>
                  Good Morning, {farmerProfile.name}!
                </h1>

                <p>
                  Here's how your farm is doing today.
                </p>
              </div>
            </div>

            <div className="top-actions">
              <span className="location">
                <MapPin size={16} />{" "}
                {farmerProfile.location}
              </span>

              <span className="weather-mini">
                <Sun size={22} />
                <b>{farmerProfile.temperature}</b>
                <small>{farmerProfile.weatherLabel}</small>
              </span>

              <div className="profile">
                <div className="avatar">RP</div>

                <div>
                  <b>{farmerProfile.name}</b>
                  <small>{farmerProfile.role}</small>
                </div>

                <ChevronDown size={16} />
              </div>
            </div>
          </header>

          <section className="metric-grid">
            <StatusCard
              icon={Droplets}
              title="Water Level"
              value={`${mlPayload.water_level.toFixed(1)} m`}
              note="Healthy · current reading"
              tone="blue"
            />

            <StatusCard
              icon={Gauge}
              title="Borewell Health"
              value={m.health_score}
              note="ML health score"
              tone="green"
            />

            <StatusCard
              icon={Zap}
              title="Power Status"
              value={faults.length ? "Attention" : "Normal"}
              note={`Voltage ${t.voltage_rms} V`}
              tone="amber"
            />

            <StatusCard
              icon={Radio}
              title="System Status"
              value={systemStatus}
              note={`ML confidence ${(m.confidence * 100).toFixed(0)}%`}
              tone="green"
            />
          </section>
        </section>

        <div className="page-inner">
          <section className="dashboard-grid">

            <div className="main-column">
              <FarmScene />

              <div className="below-farm">
                <section className="card trend-card">
                  <div className="section-head">
                    <div>
                      <span className="eyebrow">
                        <Droplets size={15} /> WATER LEVEL TREND
                      </span>

                      <h2>Last 7 days</h2>
                    </div>

                    <span className="select-look">
                      Demo history <ChevronDown size={13} />
                    </span>
                  </div>

                  <WaterChart />
                </section>
              </div>

              <Telemetry />
              <MlAnalytics />

              <section className="card borewell-info-card">
                <div className="section-head">
                  <div>
                    <span className="eyebrow">
                      <Droplets size={15} /> BOREWELL INFORMATION
                    </span>

                    <h2>Latest system identity</h2>
                  </div>

                  <span className="payload-id">
                    Exact payload
                  </span>
                </div>

                <div className="borewell-info-grid">
                  <div>
                    <span>Device ID</span>
                    <b>{mlPayload.device_id}</b>
                  </div>

                  <div>
                    <span>Latest Reading</span>
                    <b>{mlPayload.dt}</b>
                  </div>

                  <div>
                    <span>Water Level</span>
                    <b>
                      {mlPayload.water_level.toFixed(1)} m
                    </b>
                  </div>

                  <div>
                    <span>Monitoring</span>
                    <b>Active</b>
                  </div>
                </div>
              </section>
            </div>

            <aside className="middle-column">
              <Advisory />
            </aside>

            <aside className="right-column">
              <WeatherCard />

              <QuickActions />

              <section
                className="card alerts-card"
                id="reports"
              >
                <div className="section-head compact">
                  <div>
                    <span className="eyebrow">
                      <Bell size={15} /> RECENT ALERTS
                    </span>

                    <h2>
                      {faults.length
                        ? "Attention"
                        : "No recent alerts"}
                    </h2>
                  </div>

                  <span>View all →</span>
                </div>

                <div
                  className={`alert-row ${
                    faults.length ? "alert-fault" : ""
                  }`}
                >
                  <span className="alert-icon">
                    {faults.length ? "!" : "✓"}
                  </span>

                  <div>
                    <b>
                      {faults.length
                        ? faults.join(", ")
                        : "No active faults"}
                    </b>

                    <small>
                      {faults.length
                        ? "Reported by ML analytics."
                        : "Everything looks good."}
                    </small>
                  </div>
                </div>
              </section>

              <section className="card insights-card">
                <div className="section-head compact">
                  <div>
                    <span className="eyebrow">
                      <Leaf size={15} /> TODAY'S INSIGHTS
                    </span>

                    <h2>
                      Simple, useful information
                    </h2>
                  </div>
                </div>

                <div className="insight-box">
                  <div className="insight-icon">
                    <Leaf size={23} />
                  </div>

                  <div>
                    <b>
                      Water level is{" "}
                      {mlPayload.water_level.toFixed(1)} m
                    </b>

                    <p>
                      Health score {m.health_score}. ML
                      confidence{" "}
                      {(m.confidence * 100).toFixed(0)}%.
                      {faults.length
                        ? ` Active fault: ${faults.join(", ")}.`
                        : " No active faults detected."}
                    </p>
                  </div>
                </div>

                <div className="future-line">
                  Smart Farming for a Brighter Future{" "}
                  <Leaf size={14} />
                </div>
              </section>
            </aside>

          </section>
        </div>
      </section>
    </main>
  );
}