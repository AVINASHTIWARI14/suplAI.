import { Fragment, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { resolveCoordinates } from '../utils/geocode.js';
import { riskColor } from '../utils/risk.js';
import MapFitBounds from './MapFitBounds.jsx';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
];

const DEFAULT_ZOOM = 3;

const TERRAIN_TILES = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
const TERRAIN_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';

/*
 * Compact, premium circular node.
 * Smaller than the previous version so nearby suppliers stay distinguishable
 * when the map is zoomed out.
 */
const userIcon = (color, size = 'small') =>
  L.divIcon({
    className: 'suplai-map-marker-wrap',
    html: `
      <span class="suplai-node ${size}" style="--node-color:${color}">
        <span class="suplai-node-halo"></span>
        <span class="suplai-node-ring"></span>
        <span class="suplai-node-core">
          <span class="suplai-node-head"></span>
          <span class="suplai-node-shoulders"></span>
        </span>
      </span>
    `,
    iconSize: size === 'large' ? [38, 38] : [28, 28],
    iconAnchor: size === 'large' ? [19, 19] : [14, 14],
    tooltipAnchor: [0, -18],
  });

/*
 * Creates a smooth geographic arc instead of a straight line.
 * This makes routes visually read as logistics/flight paths.
 */
const createArc = (from, to) => {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const points = [];
  const segments = 36;

  const lngDiff = lng2 - lng1;
  const shortestLngDiff =
    Math.abs(lngDiff) > 180
      ? lngDiff - Math.sign(lngDiff) * 360
      : lngDiff;

  const midLat = (lat1 + lat2) / 2;
  const midLng = lng1 + shortestLngDiff / 2;

  const distance = Math.sqrt(
    Math.pow(lat2 - lat1, 2) +
      Math.pow(shortestLngDiff * Math.cos((midLat * Math.PI) / 180), 2),
  );

  // More curvature for longer routes, less for short regional routes.
  const curve = Math.min(18, Math.max(3.5, distance * 0.085));

  const controlLat =
    midLat +
    (lat1 <= lat2 ? curve : -curve);

  const controlLng =
    midLng;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const oneMinusT = 1 - t;

    const lat =
      oneMinusT * oneMinusT * lat1 +
      2 * oneMinusT * t * controlLat +
      t * t * lat2;

    const lng =
      oneMinusT * oneMinusT * lng1 +
      2 * oneMinusT * t * controlLng +
      t * t * (lng1 + shortestLngDiff);

    points.push([lat, lng]);
  }

  return points;
};

/* Keeps "-" disabled at the default zoom */
const MapZoomGuard = () => {
  const map = useMap();

  useEffect(() => {
    const updateMinusButton = () => {
      const minusButton = map
        .getContainer()
        .querySelector('.leaflet-control-zoom-out');

      if (!minusButton) return;

      const atDefaultZoom = map.getZoom() <= DEFAULT_ZOOM;

      minusButton.disabled = atDefaultZoom;
      minusButton.setAttribute(
        'aria-disabled',
        atDefaultZoom ? 'true' : 'false',
      );

      minusButton.style.cursor = atDefaultZoom
        ? 'not-allowed'
        : 'pointer';
      minusButton.style.opacity = atDefaultZoom ? '0.45' : '1';
      minusButton.style.pointerEvents = atDefaultZoom
        ? 'none'
        : 'auto';
    };

    updateMinusButton();
    map.on('zoomend', updateMinusButton);

    return () => {
      map.off('zoomend', updateMinusButton);
    };
  }, [map]);

  return null;
};

const MapPanel = ({
  suppliers = [],
  graph,
  companyCoords,
}) => {
  const points = useMemo(() => {
    return suppliers
      .map((supplier) => {
        const coords = resolveCoordinates(supplier);

        if (coords?.lat == null || coords?.lng == null) {
          return null;
        }

        return {
          ...supplier,
          lat: coords.lat,
          lng: coords.lng,
          color: riskColor(supplier.risk_score ?? 0),
        };
      })
      .filter(Boolean);
  }, [suppliers]);

  const hub = useMemo(() => {
    if (
      companyCoords?.lat != null &&
      companyCoords?.lng != null
    ) {
      return companyCoords;
    }

    const companyNode = graph?.nodes?.find(
      (node) => node.type === 'company',
    );

    if (companyNode) {
      return resolveCoordinates({
        location: companyNode.label,
        id: companyNode.id,
      });
    }

    return null;
  }, [companyCoords, graph]);

  const edges = useMemo(() => {
    if (!graph?.edges?.length || !points.length || !hub) {
      return [];
    }

    const byId = Object.fromEntries(
      points.map((point) => [point.id, point]),
    );

    return graph.edges
      .map((edge) => {
        const target = byId[edge.target];

        if (!target) return null;

        return createArc(
          [hub.lat, hub.lng],
          [target.lat, target.lng],
        );
      })
      .filter(Boolean);
  }, [graph, points, hub]);

  const counts = useMemo(() => {
    const high = points.filter(
      (point) => (point.risk_score ?? 0) >= 60,
    ).length;

    const medium = points.filter(
      (point) =>
        (point.risk_score ?? 0) >= 30 &&
        (point.risk_score ?? 0) < 60,
    ).length;

    const low = points.filter(
      (point) => (point.risk_score ?? 0) < 30,
    ).length;

    return {
      high,
      medium,
      low,
      total: points.length,
    };
  }, [points]);

  const mapKey = useMemo(
    () =>
      points.map((point) => point.id).join('-') +
      (hub ? `${hub.lat}-${hub.lng}` : ''),
    [points, hub],
  );

  return (
    <div className="card map-card">
      <div className="map-card-header">
        <div
          className="card-header"
          style={{ marginBottom: 0 }}
        >
          <h3 className="card-title">
            Global Supply Chain Risk Map
          </h3>

          <div className="map-legend">
            <span>
              <span className="dot high" /> High
            </span>
            <span>
              <span className="dot medium" /> Medium
            </span>
            <span>
              <span className="dot low" /> Low
            </span>
            <span className="company-legend">
              <span className="company-legend-dot">●</span>
              Company HQ
            </span>
          </div>
        </div>
      </div>

      <div className="map-viewport">
        <MapContainer
          key={mapKey}
          center={[20, 0]}
          zoom={DEFAULT_ZOOM}
          minZoom={2}
          maxZoom={12}
          zoomControl
          worldCopyJump={false}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          style={{
            height: '100%',
            width: '100%',
            background: '#a8d4f0',
          }}
        >
          <TileLayer
            url={TERRAIN_TILES}
            attribution={TERRAIN_ATTRIBUTION}
            noWrap
            bounds={WORLD_BOUNDS}
          />

          <MapFitBounds />
          <MapZoomGuard />

          {hub && (
            <Marker
              position={[hub.lat, hub.lng]}
              icon={userIcon('#1688ff', 'large')}
              zIndexOffset={1000}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                className="suplai-map-tooltip"
              >
                <div className="map-tooltip-title">
                  Company HQ
                </div>
                <div className="map-tooltip-subtitle">
                  {hub.location || 'Headquarters'}
                </div>
              </Tooltip>
            </Marker>
          )}

          {points.map((supplier) => (
            <Marker
              key={supplier.id}
              position={[supplier.lat, supplier.lng]}
              icon={userIcon(supplier.color)}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                className="suplai-map-tooltip"
              >
                <div className="map-tooltip-title">
                  {supplier.name}
                </div>
                <div className="map-tooltip-subtitle">
                  {supplier.location || supplier.country}
                </div>
                <div className="map-tooltip-risk">
                  Risk {Math.round(supplier.risk_score ?? 0)}
                </div>
              </Tooltip>
            </Marker>
          ))}

          {edges.map((positions, index) => (
            <Fragment key={`edge-${index}`}>
              {/* Wide soft glow */}
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#38a9ff',
                  weight: 7,
                  opacity: 0.14,
                  className: 'map-route-glow',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Thin dark route for contrast */}
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#071a31',
                  weight: 3.5,
                  opacity: 0.7,
                  className: 'map-route-base',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Bright moving logistics flow */}
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2.2,
                  opacity: 0.92,
                  className: 'map-route-flow',
                  dashArray: '4 12',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </Fragment>
          ))}
        </MapContainer>
      </div>

      <div className="map-stats">
        <span className="high">
          {counts.high} High Risk Suppliers
        </span>
        <span className="medium">
          {counts.medium} Medium Risk
        </span>
        <span className="low">
          {counts.low} Low Risk
        </span>
        <span>
          {counts.total} Total Suppliers
        </span>
      </div>
    </div>
  );
};

export default MapPanel;
