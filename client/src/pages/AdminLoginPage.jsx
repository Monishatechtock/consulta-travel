import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/admin.css';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      notify({
        type: 'success',
        title: 'Welcome back',
        message: 'Administrator session started.',
      });
      const redirectTo = location.state?.from?.pathname || '/admin';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Sign-in failed',
        message: err.message || 'Check your credentials and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <Brand to="/" />
        <h1>Administrator sign-in</h1>
        <p className="lead">
          Access the Consulta travel operations dashboard to review participant
          submissions.
        </p>

        <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="loader loader-inline" /> Signing in…
            </>
          ) : (
            'Sign in to dashboard'
          )}
        </button>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/">← Back to participant portal</Link>
        </p>
      </form>
    </div>
  );
}
