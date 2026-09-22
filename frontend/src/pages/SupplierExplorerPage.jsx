import { useEffect, useMemo, useState } from 'react';

import SupplierCard from '../components/SupplierCard.jsx';

import { fetchSupplierRisk } from '../api/client.js';

import { compositeFromSupplier } from '../utils/risk.js';

const SupplierExplorerPage = ({ companyId }) => {
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');

  const [riskMax, setRiskMax] = useState(100);
  const [costMax, setCostMax] = useState(100);
  const [leadMax, setLeadMax] = useState(90);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH SUPPLIERS
     ========================================================= */

  useEffect(() => {
    setLoading(true);

    fetchSupplierRisk(companyId)
      .then((data) => {
        setSuppliers(data || []);
      })
      .catch(() => {
        setSuppliers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId]);

  /* =========================================================
     COUNTRIES
     ========================================================= */

  const countries = useMemo(() => {
    const values = suppliers
      .map(
        (supplier) =>
          supplier.country ||
          supplier.location ||
          'Unknown'
      )
      .filter(Boolean);

    return [
      'All',
      ...Array.from(new Set(values)),
    ];
  }, [suppliers]);

  /* =========================================================
     FILTER SUPPLIERS
     ========================================================= */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers
      .map((supplier) => ({
        ...supplier,
        composite_score:
          supplier.composite_score ??
          compositeFromSupplier(supplier),
      }))
      .filter((supplier) => {
        const name = (
          supplier.name || ''
        ).toLowerCase();

        const location = `
          ${supplier.country || ''}
          ${supplier.location || ''}
        `.toLowerCase();

        const risk = Number(
          supplier.risk_score ?? 0
        );

        const cost = Number(
          supplier.cost_index ?? 50
        );

        const lead = Number(
          supplier.lead_time_days ?? 30
        );

        return (
          name.includes(query) &&
          (
            country === 'All' ||
            location.includes(
              country.toLowerCase()
            )
          ) &&
          risk <= riskMax &&
          cost <= costMax &&
          lead <= leadMax
        );
      })
      .sort(
        (a, b) =>
          (b.composite_score ?? 0) -
          (a.composite_score ?? 0)
      );
  }, [
    suppliers,
    search,
    country,
    riskMax,
    costMax,
    leadMax,
  ]);

  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const resetFilters = () => {
    setSearch('');
    setCountry('All');
    setRiskMax(100);
    setCostMax(100);
    setLeadMax(90);
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="supplier-explorer-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="supplier-explorer-header">
        <div>
          <p className="supplier-explorer-eyebrow">
            SUPPLIER INTELLIGENCE
          </p>

          <h1>
            Supplier Explorer
          </h1>

          <p className="supplier-explorer-subtitle">
            Search and filter suppliers by risk, cost, and lead time.
          </p>
        </div>
      </section>


      {/* =====================================================
          SEARCH / COUNTRY / RESET
          ===================================================== */}

      <section className="supplier-explorer-toolbar">

        {/* SEARCH */}

        <div className="supplier-search-wrap">

          <span className="supplier-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search suppliers..."
            aria-label="Search suppliers"
          />

        </div>


        {/* COUNTRY */}

        <div className="supplier-country-wrap">

          <select
            id="supplier-country"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
            }}
            aria-label="Country"
          >
            <option value="All">
              Country
            </option>

            {countries
              .filter((item) => item !== 'All')
              .map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
          </select>

        </div>


        {/* RESET */}

        <button
          type="button"
          className="supplier-reset-button"
          onClick={resetFilters}
        >
          Reset
        </button>

      </section>


      {/* =====================================================
          FILTERS + RESULTS
          ===================================================== */}

      <section className="supplier-explorer-content">

        {/* ===================================================
            FILTER PANEL
            =================================================== */}

        <aside className="supplier-filters-panel">

          {/* RISK SCORE */}

          <div className="supplier-filter-control">

            <div className="supplier-filter-label">

              <span>
                Risk Score
              </span>

              <strong>
                {riskMax}
              </strong>

            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={riskMax}
              onChange={(event) => {
                setRiskMax(
                  Number(event.target.value)
                );
              }}
              aria-label="Maximum risk score"
            />

          </div>


          {/* COST INDEX */}

          <div className="supplier-filter-control">

            <div className="supplier-filter-label">

              <span>
                Cost Index
              </span>

              <strong>
                {costMax}
              </strong>

            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={costMax}
              onChange={(event) => {
                setCostMax(
                  Number(event.target.value)
                );
              }}
              aria-label="Maximum cost index"
            />

          </div>


          {/* LEAD TIME */}

          <div className="supplier-filter-control">

            <div className="supplier-filter-label">

              <span>
                Lead Time
              </span>

              <strong>
                {leadMax} days
              </strong>

            </div>

            <input
              type="range"
              min="1"
              max="90"
              value={leadMax}
              onChange={(event) => {
                setLeadMax(
                  Number(event.target.value)
                );
              }}
              aria-label="Maximum lead time"
            />

          </div>

        </aside>


        {/* ===================================================
            SUPPLIER RESULTS
            =================================================== */}

        <div className="supplier-results">

          {/* LOADING */}

          {loading ? (

            <div className="supplier-state-card">
              Loading suppliers...
            </div>

          ) : filtered.length > 0 ? (

            /* SUPPLIER CARDS */

            <div className="supplier-grid">

              {filtered.map(
                (supplier, index) => (
                  <SupplierCard
                    key={
                      supplier.id ??
                      `${supplier.name}-${index}`
                    }
                    supplier={supplier}
                  />
                )
              )}

            </div>

          ) : (

            /* NO RESULTS */

            <div className="supplier-state-card">

              <strong>
                No suppliers match your filters.
              </strong>

              <span>
                Try widening the risk, cost, or
                lead-time limits.
              </span>

            </div>

          )}

        </div>

      </section>

    </div>
  );
};

export default SupplierExplorerPage;