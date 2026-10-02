import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function color(s) {
  return s === "CRITICAL"
    ? "#FF5364"
    : s === "WARNING"
      ? "#FFC83D"
      : "#55D66B";
}

function status(x) {
  if (x.status) return String(x.status).toUpperCase();

  const h = Number(x.healthScore);
  const w = Number(x.waterLevel);

  return h < 40 || w < 20
    ? "CRITICAL"
    : h < 70
      ? "WARNING"
      : "HEALTHY";
}

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function geocodeLocation(village, district) {
  if (!TOKEN || !village) return null;

  const query = `${village}, ${district || ""}, Maharashtra, India`;

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodeURIComponent(query)}` +
    `&country=IN` +
    `&types=place,district` +
    `&limit=1` +
    `&access_token=${TOKEN}`;

  try {
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    const feature = data?.features?.[0];

    if (!feature?.geometry?.coordinates) return null;

    const [lng, lat] = feature.geometry.coordinates;

    return { lat, lng };
  } catch {
    return null;
  }
}

export default function BorewellMap({ locations = [] }) {
  const ref = useRef();
  const map = useRef();
  const markers = useRef([]);

  // Create map
  useEffect(() => {
    if (!TOKEN || !ref.current || map.current) return;

    mapboxgl.accessToken = TOKEN;

    map.current = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [74.5, 19.1],
      zoom: 6.3
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      "top-right"
    );

    return () => {
      markers.current.forEach(m => m.remove());
      markers.current = [];

      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Create markers from village/district
  useEffect(() => {
    if (!map.current) return;

    let cancelled = false;

    async function renderMarkers() {
      markers.current.forEach(m => m.remove());
      markers.current = [];

      for (const x of locations) {
        if (cancelled) return;

        let lat = Number(x.latitude ?? x.lat);
        let lng = Number(
          x.longitude ?? x.lon ?? x.lng
        );

        // If GPS coordinates exist, use them.
        // Otherwise geocode village + district.
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          const result = await geocodeLocation(
            x.village,
            x.district
          );

          if (!result) continue;

          lat = result.lat;
          lng = result.lng;
        }

        const s = status(x);

        const el = document.createElement("div");

        el.className = "borewell-marker";
        el.style.background = color(s);

        const popup = new mapboxgl.Popup({
          offset: 18
        }).setHTML(`
          <div class="popup">

            <strong>
              ${esc(x.deviceId || "Borewell")}
            </strong>

            <div>
              Village: ${esc(x.village || "—")}
            </div>

            <div>
              District: ${esc(x.district || "—")}
            </div>

            <div>
              Water level: ${esc(x.waterLevel ?? "—")}
            </div>

            <div>
              Health: ${esc(x.healthScore ?? "—")}
            </div>

            <div>
              Status: ${esc(s)}
            </div>

          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);

        markers.current.push(marker);
      }
    }

    renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [locations]);

  if (!TOKEN) {
    return (
      <div className="map-placeholder">
        <div>
          <div className="map-placeholder-icon">
            🗺️
          </div>

          <h4>Mapbox token required</h4>

          <p>
            Add{" "}
            <code>VITE_MAPBOX_TOKEN</code>{" "}
            to <code>.env</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="real-map"
    />
  );
}