import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from './Brand';
import { IconLogout, IconMenu, IconClose } from './Icons';
import { useAuth } from '../context/AuthContext';

export default function AdminHeader() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (admin?.displayName || admin?.username || 'A')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-header no-print">
      <div className="container" style={{ position: 'relative' }}>
        <div className="admin-header-left">
          <Brand to="/admin" subtitle="Operations" />
          <div className="admin-title">
            <span>Workspace</span>
            <strong>Travel Dashboard</strong>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-profile" title={admin?.displayName || 'Administrator'}>
            <div className="admin-avatar">{initials}</div>
            <div>
              <strong>{admin?.displayName || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button className="btn btn-ghost logout-desktop" type="button" onClick={onLogout}>
            <IconLogout />
            <span>Logout</span>
          </button>
          <button
            className="btn btn-icon mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        <div className={`admin-mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="admin-profile" style={{ width: '100%' }}>
            <div className="admin-avatar">{initials}</div>
            <div style={{ display: 'flex' }}>
              <strong>{admin?.displayName || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" type="button" onClick={onLogout}>
            <IconLogout /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
