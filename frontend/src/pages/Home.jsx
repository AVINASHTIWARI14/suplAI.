import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cargoShipHome from '../assets/cargo-ship-home.png';
import freightTruckHome from '../assets/freight-truck-home.png';
import cargoPlaneHome from '../assets/cargo-plane-home.png';
import { useAuth } from '../context/AuthContext.jsx';

const backgroundSlides = [cargoShipHome, freightTruckHome, cargoPlaneHome];
const featureCards = [
  {
    title: 'Supplier Risk Intelligence',
    summary: 'Identify suppliers that could put your operations at risk.',
    detail: 'SuplAI evaluates supplier-level risk and assigns a clear risk score so teams can prioritize vulnerabilities.',
    points: 'Risk Score • Risk Factors • Prioritization',
  },
  {
    title: 'What-If Simulation',
    summary: 'See the impact before a disruption happens.',
    detail: 'Simulate supplier failures and visualize how disruption propagates across your supply network.',
    points: 'Failure Simulation • Network Impact • Risk Delta',
  },
  {
    title: 'Alternative Suppliers',
    summary: 'Find alternatives when your supply chain is at risk.',
    detail: 'Compare potential suppliers and identify options that can help maintain supply continuity.',
    points: 'Alternatives • Risk Comparison • Continuity',
  },
  {
    title: 'Supply-Chain Network',
    summary: 'Understand how your suppliers are connected.',
    detail: 'SuplAI maps supplier relationships and dependencies into a visual supply-chain network, helping you identify critical nodes, hidden dependencies, and potential single points of failure.',
    points: 'Multi-Tier Mapping • Dependency Analysis • Critical Nodes',
  },
  {
    title: 'Disruption Monitoring',
    summary: 'Stay ahead of supply-chain disruptions.',
    detail: 'SuplAI monitors relevant risk signals and highlights potential threats such as logistics issues, extreme weather, market movements, and other external events that may affect supplier operations.',
    points: 'Disruption Detection • External Signals • Risk Alerts',
  },
];

const Home = () => {
  const loginRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  useEffect(() => {
    if (location.hash !== '#login') return;
    requestAnimationFrame(() => {
      loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      loginRef.current?.querySelector('input[type="email"]')?.focus({ preventScroll: true });
    });
  }, [location.hash]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (loginError) {
      setError(loginError.response?.data?.detail || 'Unable to log in. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName, null);
      navigate('/dashboard');
    } catch (regError) {
      setError(regError.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      <div className="home-background" aria-hidden="true">
        <div className="home-background-track">
          {[...backgroundSlides, ...backgroundSlides].map((image, index) => (
            <img className="home-background-slide" src={image} alt="" key={`${image}-${index}`} />
          ))}
        </div>
      </div>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <h1 id="home-title"><span className="home-title-main home-title-bold">Know what is coming,</span><br /><span className="home-title-highlight">Keep supply moving<span className="home-typing-cursor" aria-hidden="true">|</span></span></h1>
        </div>
      </section>

      <section className="home-feature-section" aria-label="SuplAI capabilities">
        <div className="home-feature-cards">
          <div className="home-feature-track">
            {[0, 1].map((set) => (
              <div className="home-feature-card-group" key={set} aria-hidden={set === 1}>
                {featureCards.map((card) => (
                  <article className="home-feature-card" key={`${set}-${card.title}`}>
                    <h2>{card.title}</h2>
                    <p>{card.summary}</p>
                    <p>{card.detail}</p>
                    <span>{card.points}</span>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="login" ref={loginRef} className="home-login-section" aria-labelledby="home-card-title">

        {mode === 'login' ? (
          <form className="home-login-form" onSubmit={handleLogin}>
            <h2 id="home-card-title">Welcome back</h2>
            <div className="home-login-field">
              <label htmlFor="hl-email">Email</label>
              <div className="home-login-input-wrap">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v14H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <input id="hl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
              </div>
            </div>
            <div className="home-login-field">
              <label htmlFor="hl-password">Password</label>
              <div className="home-login-input-wrap">
                <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <input id="hl-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" minLength={6} required />
              </div>
            </div>
            <div className="home-login-options">
              <label><input type="checkbox" /> Remember me</label>
              <span className="home-login-link">Forgot password?</span>
            </div>
            {error && <p className="home-login-error">{error}</p>}
            <button type="submit" className="home-login-submit" disabled={loading}>
              {loading ? 'Please wait\u2026' : 'Login'}
            </button>
            <p className="home-login-register">
              New to SuplAI?{' '}
              <span className="home-login-link" onClick={() => switchMode('register')}>
                Create an account
              </span>
            </p>
          </form>
        ) : (
          <form className="home-login-form" onSubmit={handleRegister}>
            <h2>Create account</h2>
            <div className="home-login-field">
              <label htmlFor="hr-name">Full name</label>
              <div className="home-login-input-wrap">
                <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <input id="hr-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
              </div>
            </div>
            <div className="home-login-field">
              <label htmlFor="hr-email">Email</label>
              <div className="home-login-input-wrap">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v14H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <input id="hr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
              </div>
            </div>
            <div className="home-login-field">
              <label htmlFor="hr-password">Password</label>
              <div className="home-login-input-wrap">
                <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <input id="hr-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
              </div>
            </div>
            {error && <p className="home-login-error">{error}</p>}
            <button type="submit" className="home-login-submit" disabled={loading}>
              {loading ? 'Creating account\u2026' : 'Create account'}
            </button>
            <p className="home-login-register">
              Already have an account?{' '}
              <span className="home-login-link" onClick={() => switchMode('login')}>
                Sign in
              </span>
            </p>
          </form>
        )}

        <div className="home-login-cta">
          <h2 className="home-login-cta-heading">Login/Signup<br /><span className="home-login-cta-now">now</span></h2>
        </div>

      </section>

      <section className={`home-bottom-card-section ${howToUseOpen ? 'is-expanded' : ''}`} aria-label="How to use SuplAI">
        <button
          type="button"
          className="home-bottom-card"
          aria-expanded={howToUseOpen}
          aria-controls="home-how-to-content"
          onClick={() => setHowToUseOpen((open) => !open)}
        >
          <span className="home-bottom-card-content">
            <span className="home-bottom-card-heading">How to use?</span>
          </span>
        </button>

        <div
          id="home-how-to-content"
          className={`home-how-to-content ${howToUseOpen ? 'is-open' : ''}`}
          aria-hidden={!howToUseOpen}
        >
          <div className="home-how-to-inner">
            <div className="home-how-to-steps">
              <article className="home-how-to-step">
                <div>
                  <h4>Dashboard</h4>
                  <p>
                    Select your company and begin from the Dashboard. Use the overview to understand
                    the current supplier landscape, overall risk, active disruptions and the areas
                    that need attention first. Treat this as your starting point before drilling into
                    an individual supplier or scenario.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Suppliers</h4>
                  <p>
                    Open <strong>Suppliers</strong> to review individual suppliers and their risk scores.
                    Check the risk level and the factors contributing to it, then focus on suppliers
                    with higher exposure or operational importance. You can also import or manage supplier
                    records where supported.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Network</h4>
                  <p>
                    Open <strong>Network</strong> to see how suppliers and dependencies connect. Trace
                    relationships across tiers, look for critical nodes and identify where one supplier
                    can influence other parts of the network. This gives context to a supplier risk score.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>What-If Simulation</h4>
                  <p>
                    Choose a supplier and run a disruption scenario. SuplAI models how the disruption
                    can propagate through connected dependencies and shows the affected part of the
                    network and the resulting change in network risk. Use different scenarios to understand
                    where a failure could create cascading impact.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Alternatives</h4>
                  <p>
                    When a supplier looks vulnerable, open <strong>Alternatives</strong> to review potential
                    replacement options. Compare available supplier information and risk characteristics
                    so you can evaluate which options may help maintain supply continuity.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Disruptions</h4>
                  <p>
                    Use <strong>Disruptions</strong> to review events that may affect suppliers or logistics,
                    including relevant weather, market, news or operational signals available to the platform.
                    Open an event to understand its relevance and connect the signal back to affected suppliers.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Alerts</h4>
                  <p>
                    Check <strong>Alerts</strong> for important risk changes and signals. Use alerts as a
                    prioritization layer: investigate the supplier or disruption behind an alert, then move
                    into Network, Simulation or Alternatives when deeper analysis is required.
                  </p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>Settings & Data</h4>
                  <p>
                    Use <strong>Settings</strong> for available account and workspace controls. Keep supplier
                    information organized and up to date so the risk, network and simulation views remain
                    useful. Export available reports or data when you need to share analysis.
                  </p>
                </div>
              </article>
            </div>

            <div className="home-how-to-final">
              <span>SUPLAI IN ONE FLOW</span>
              <strong>Supplier → Risk → Network → Simulation → Alternatives → Action</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
/*  */
