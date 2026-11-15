import { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconGlobe,
  IconMail,
  IconMenu,
  IconNote,
  IconPhone,
  IconPin,
  IconPlane,
  IconTicket,
  IconUser,
} from '../components/Icons';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime } from '../utils/format';
import '../styles/landing.css';

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
    </svg>
  );
}

function Row({ icon, label, value, valueClassName = '' }) {
  if (value == null || String(value).trim() === '') return null;
  return (
    <div className="confirm-meta-row">
      <span>
        {icon}
        {label}
      </span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}

export default function ConfirmationPage() {
  const location = useLocation();
  const participant = location.state?.participant;
  const [menuOpen, setMenuOpen] = useState(false);

  if (!participant) {
    return <Navigate to="/" replace />;
  }

  const reference = `CT-${String(participant.id).padStart(5, '0')}`;

  return (
    <div className="confirm-page confirm-fixed confirm-v3">
      <div className="confirm-bg" aria-hidden />
      <div className="confirm-wash confirm-wash-v3" aria-hidden />

      <header className="confirm-topbar confirm-topbar-v3">
        <div className="confirm-menu-wrap">
          <button
            type="button"
            className="confirm-menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconMenu />
          </button>
          {menuOpen ? (
            <div className="confirm-menu-dropdown">
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/admin/login" onClick={() => setMenuOpen(false)}>
                Administrator
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      <main className="confirm-stage">
        <div className="confirm-card confirm-card-v3">
          <div className="confirm-success-wrap" aria-hidden>
            <span className="confirm-spark confirm-spark-1" />
            <span className="confirm-spark confirm-spark-2" />
            <span className="confirm-spark confirm-spark-3" />
            <span className="confirm-spark confirm-spark-4" />
            <div className="confirm-icon confirm-icon-v3">
              <IconCheck width={30} height={30} strokeWidth="2.8" />
            </div>
          </div>

          <div className="confirm-title-pill">Submission Received!</div>

          <div className="confirm-plane-badge" aria-hidden>
            <IconPlane width={26} height={26} />
            <span className="confirm-plane-check">
              <IconCheck width={12} height={12} strokeWidth="3" />
            </span>
          </div>

          <h1 className="confirm-thanks">
            Thank you, <span>{participant.fullName}!</span>
          </h1>
          <p className="confirm-lead">Your travel request has been received successfully.</p>

          <div className="confirm-meta confirm-meta-v3">
            <div className="confirm-meta-row">
              <span>
                <IconNote width={15} height={15} />
                Reference
              </span>
              <strong className="confirm-ref-pill">{reference}</strong>
            </div>
            <div className="confirm-meta-row">
              <span>
                <IconClock width={15} height={15} />
                Status
              </span>
              <strong>
                <StatusBadge status={participant.status || 'Pending'} />
              </strong>
            </div>
            <Row icon={<IconUser width={15} height={15} />} label="Full Name" value={participant.fullName} />
            <Row icon={<IconMail width={15} height={15} />} label="Email" value={participant.email} />
            <Row icon={<IconPhone width={15} height={15} />} label="Mobile" value={participant.phone} />
            <Row icon={<IconGlobe width={15} height={15} />} label="Country" value={participant.country} />
            <Row icon={<IconTicket width={15} height={15} />} label="Flight No." value={participant.flightNumber} />
            <Row icon={<IconPin width={15} height={15} />} label="Arrival Airport" value={participant.arrivalAirport} />
            <Row
              icon={<IconCalendar width={15} height={15} />}
              label="Arrival Date & Time"
              value={
                participant.arrivalDatetime ? formatDateTime(participant.arrivalDatetime) : null
              }
            />
            <Row
              icon={<IconPin width={15} height={15} />}
              label="Departure Airport"
              value={participant.departureAirport}
            />
            <Row
              icon={<IconCalendar width={15} height={15} />}
              label="Departure Date & Time"
              value={
                participant.departureDatetime
                  ? formatDateTime(participant.departureDatetime)
                  : null
              }
            />
            <Row
              icon={<IconNote width={15} height={15} />}
              label="Notes"
              value={participant.specialRequests}
            />
          </div>

          <div className="confirm-actions confirm-actions-v3">
            <Link className="btn confirm-home-btn confirm-home-btn-v3" to="/">
              <IconHome />
              Return to Home
            </Link>
          </div>

          <footer className="confirm-card-footer">
            <span className="footer-mail">
              <IconMail width={14} height={14} />
              Responses: jsathishpaul@gmail.com
            </span>
            <span className="confirm-footer-sep" aria-hidden>
              |
            </span>
            <span className="confirm-copy">© 2026 Consulta Travel Information</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
