const getRiskLevel = (score) => {
  const value = Number(score ?? 0);

  if (value >= 70) {
    return 'HIGH';
  }

  if (value >= 40) {
    return 'MEDIUM';
  }

  return 'LOW';
};

const SupplierCard = ({ supplier }) => {
  const riskScore = Number(supplier.risk_score ?? 0);
  const costIndex = Number(supplier.cost_index ?? 0);
  const leadTime = Number(supplier.lead_time_days ?? 0);

  const riskLevel = getRiskLevel(riskScore);

  const category =
    supplier.category ||
    supplier.industry ||
    supplier.sector ||
    supplier.type ||
    'Supplier';

  const location =
    supplier.location ||
    supplier.country ||
    'Global';

  const supplierName =
    supplier.name ||
    'Unknown Supplier';

  return (
    <article className="supplier-card">

      {/* TITLE + RISK */}

      <div className="supplier-card-header">

        <h3 className="supplier-card-name">
          {supplierName}
        </h3>

        <span
          className={`supplier-risk supplier-risk-${riskLevel.toLowerCase()}`}
        >
          {riskLevel}
        </span>

      </div>


      {/* SUPPLIER INFORMATION */}

      <p className="supplier-card-meta">
        {category} · {location}
      </p>


      {/* METRICS */}

      <div className="supplier-card-stats">

        <div className="supplier-stat">
          <span>Risk Score</span>
          <strong>{riskScore}</strong>
        </div>

        <div className="supplier-stat">
          <span>Cost Index</span>
          <strong>{costIndex}</strong>
        </div>

        <div className="supplier-stat">
          <span>Lead Time</span>
          <strong>{leadTime} days</strong>
        </div>

      </div>

    </article>
  );
};

export default SupplierCard;