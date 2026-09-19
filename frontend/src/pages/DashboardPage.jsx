import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MapPanel from '../components/MapPanel.jsx';
import { fetchDashboard, fetchSupplierRisk, fetchGraph, fetchActiveDisruptions, fetchRiskTrend } from '../api/client.js';
import { formatDate, timeAgo } from '../utils/dates.js';
import { severityFromEvent } from '../utils/risk.js';
import { resolveCoordinates } from '../utils/geocode.js';

const severityClass = (severity) => {
  const value = String(severity || '').toLowerCase();
  if (value.includes('high')) return 'severity-high';
  if (value.includes('low')) return 'severity-low';
  return 'severity-medium';
};

// Four risk bands for supplier bars/scores.
const supplierRiskClass = (score) => {
  if (score >= 80) return 'risk-dark-red';
  if (score >= 60) return 'risk-red';
  if (score >= 40) return 'risk-orange';
  return 'risk-green';
};

const DashboardPage = ({ companyId, company, onRiskChange, apiOnline }) => {
  const [dashboard, setDashboard] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [graph, setGraph] = useState(null);
  const [feed, setFeed] = useState([]);
  const [riskTrend, setRiskTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dash, supplierList, graphData, disruptions, trendData] = await Promise.all([
          fetchDashboard(companyId),
          fetchSupplierRisk(companyId),
          fetchGraph(companyId),
          fetchActiveDisruptions().catch(() => []),
          fetchRiskTrend(companyId).catch(() => []),
        ]);

        if (!active) return;

        setDashboard(dash || null);
        setSuppliers(supplierList || []);
        setGraph(graphData || null);
        setFeed(disruptions || []);
        setRiskTrend(trendData || []);
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            'Failed to load dashboard',
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [companyId]);

  useEffect(() => {
    onRiskChange?.(dashboard?.overall_risk_score ?? 0);
  }, [dashboard?.overall_risk_score, onRiskChange]);

  const activeDisruptions = dashboard?.active_disruptions ?? [];
  const topRisky = dashboard?.top_risky_suppliers ?? [];
  const feedItems = feed.length
    ? feed.slice(0, 5)
    : activeDisruptions.slice(0, 5);

  const companyCoords = useMemo(
    () =>
      resolveCoordinates({
        location: company?.location,
        country: company?.country,
        id: companyId,
      }),
    [company, companyId],
  );

  if (loading) {
    return (
      <div className="page-body loading-state">
        Loading dashboard from database…
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-body error-state">
        <h2 style={{ marginTop: 0 }}>Could not load dashboard</h2>
        <p>{error}</p>
        <p style={{ color: '#8b9bb4', fontSize: '0.9rem' }}>
          {apiOnline === false
            ? 'Start the backend: python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload'
            : 'Check your backend and Supabase configuration, then restart the app.'}
        </p>
      </div>
    );
  }

  return (
    <div className="page-body dashboard-map-dashboard">
      <section className="dashboard-map-full">
        <MapPanel
          suppliers={suppliers}
          graph={graph}
          companyCoords={companyCoords}
        />
      </section>

      <section className="dashboard-info-grid">
        {/* ACTIVE DISRUPTIONS */}
        <article className="dashboard-info-card">
          <div className="dashboard-info-header">
            <div className="dashboard-info-title">Active Disruptions</div>
          </div>

          <div className="dashboard-info-content">
            {activeDisruptions.length ? (
              <div className="dashboard-disruption-list">
                {activeDisruptions.slice(0, 5).map((event) => {
                  const severity = severityFromEvent(event);

                  return (
                    <div key={event.id} className="dashboard-disruption-row">
                      <div className="dashboard-row-main">
                        <div className="dashboard-row-title">
                          {event.event_type || 'Disruption'}
                          {event.location ? ` · ${event.location}` : ''}
                        </div>
                        <div className="dashboard-row-meta">
                          {event.affected_industry || 'Supply chain'} ·{' '}
                          {event.country || 'Global'}
                        </div>
                        <div className="dashboard-row-date">
                          {formatDate(event.start_date)} · {timeAgo(event.start_date)}
                        </div>
                      </div>

                      <div className={`dashboard-severity ${severityClass(severity)}`}>
                        {String(severity || 'MEDIUM').toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-inline-empty">No active disruptions</div>
            )}

            <Link className="dashboard-info-link" to="/disruptions">
              View all disruptions
            </Link>
          </div>
        </article>

        {/* RISKY SUPPLIERS */}
        <article className="dashboard-info-card">
          <div className="dashboard-info-header">
            <div className="dashboard-info-title">Risky Suppliers</div>
          </div>

          <div className="dashboard-info-content">
            {topRisky.length ? (
              <div className="dashboard-supplier-list">
                {topRisky.slice(0, 5).map((supplier) => {
                  const score = Math.round(supplier.risk_score ?? 0);
                  const barClass = supplierRiskClass(score);

                  return (
                    <div key={supplier.id} className="dashboard-supplier-row">
                      <div className="dashboard-row-main">
                        <div className="dashboard-row-title">{supplier.name}</div>
                        <div className="dashboard-row-meta">
                          {supplier.location ||
                            supplier.country ||
                            'Location unavailable'}
                        </div>

                        <div className="dashboard-risk-bar">
                          <span
                            className={barClass}
                            style={{
                              width: `${Math.min(100, Math.max(0, score))}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div
                        className={`dashboard-supplier-score ${barClass}`}
                      >
                        {score}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-inline-empty">
                No risky suppliers found
              </div>
            )}

            <Link className="dashboard-info-link" to="/suppliers">
              View all suppliers
            </Link>
          </div>
        </article>

        {/* DISRUPTION FEED */}
        <article className="dashboard-info-card">
          <div className="dashboard-info-header">
            <div className="dashboard-info-title">Disruption Feed</div>
          </div>

          <div className="dashboard-info-content">
            {feedItems.length ? (
              <div className="dashboard-feed-list">
                {feedItems.map((event) => {
                  const severity = severityFromEvent(event);

                  return (
                    <div key={event.id} className="dashboard-feed-row">
                      <div className="dashboard-row-main">
                        <div className="dashboard-row-title">
                          {event.event_type || 'Event'}
                        </div>
                        <div className="dashboard-row-meta">
                          {event.location || 'Global'}
                          {event.country ? `, ${event.country}` : ''}
                        </div>
                        <div className="dashboard-row-date">
                          {timeAgo(event.start_date)}
                        </div>
                      </div>

                      <div className={`dashboard-severity ${severityClass(severity)}`}>
                        {String(severity || 'MEDIUM').toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-inline-empty">No feed items</div>
            )}

            <Link className="dashboard-info-link" to="/disruptions">
              Open disruption center
            </Link>
          </div>
        </article>
      </section>

      <section className="dashboard-risk-trend-card">
        <div className="dashboard-risk-trend-header">
          <div>
            <h2 className="dashboard-risk-trend-title">Risk Score Trend</h2>
            <p className="dashboard-risk-trend-subtitle">
              Overall supply-chain risk over time
            </p>
          </div>
        </div>

        <div className="dashboard-risk-trend-chart">
          {riskTrend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={riskTrend}
                margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#183153', fontSize: 12, fontWeight: 600 }}
                  axisLine={{
                    stroke: '#183153',
                    strokeWidth: 2,
                  }}
                  tickLine={{
                    stroke: '#183153',
                    strokeWidth: 1,
                  }}
                  label={{
                    value: 'Time',
                    position: 'insideBottom',
                    offset: -4,
                    fill: '#183153',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#183153', fontSize: 12, fontWeight: 600 }}
                  axisLine={{
                    stroke: '#183153',
                    strokeWidth: 2,
                  }}
                  tickLine={{
                    stroke: '#183153',
                    strokeWidth: 1,
                  }}
                  label={{
                    value: 'Risk Score',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#183153',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0b1f3a',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '10px',
                    color: '#ffffff',
                  }}
                  labelStyle={{ color: '#F4C400' }}
                  formatter={(value) => [value, 'Risk Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#F4C400"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#F4C400',
                    stroke: '#0b1f3a',
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard-risk-trend-empty">
              No risk trend data available
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
