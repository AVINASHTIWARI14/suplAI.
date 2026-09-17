import { NavLink, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';

const TopNav = ({ companies, selectedCompanyId, onCompanyChange }) => {
  const navigate = useNavigate();

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-brand">
          <BrandLogo />
        </div>

        <nav className="header-nav" aria-label="Primary navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/suppliers"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Suppliers
          </NavLink>
          <NavLink
            to="/network"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Network
          </NavLink>
          <NavLink
            to="/alternatives"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Alternatives
          </NavLink>
          <NavLink
            to="/disruptions"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Disruptions
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Alerts
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            Settings
          </NavLink>
        </nav>

        <div className="top-nav-actions">
          <select
            className="company-select header-company-select"
            value={selectedCompanyId}
            onChange={(e) => onCompanyChange(e.target.value)}
            aria-label="Select company"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="header-login-button"
            onClick={() => navigate('/#login')}
          >
            Login
          </button>
        </div>
      </header>
    </>
  );
};

export default TopNav;
