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
  IconPrint,
  IconTicket,
  IconUser,
} from '../components/Icons';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime } from '../utils/format';
import Brand from '../components/Brand';
import '../styles/landing.css';

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
    </svg>
  );
}

function IconLanding(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 19h18" />
      <path d="M5 15.5 12 8l4 1.5 3-4.5 1.5 1-3.5 5.5 3.5 1.2L19 14l-8.5 3L5 15.5Z" />
    </svg>
  );
}

function Row({ icon, label, value }) {
  if (value == null || String(value).trim() === '') return null;
  return (
    <div className="confirm-meta-row">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
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

  return (
    <div className="confirm-page confirm-fixed confirm-v2">
      <div className="confirm-bg" aria-hidden />
      <div className="confirm-wash" aria-hidden />

      <div className="confirm-waves" aria-hidden>
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path
            d="M0,40 C220,75 420,10 680,38 C940,68 1180,18 1440,42 L1440,90 L0,90 Z"
            fill="#C5A15B"
            opacity="0.85"
          />
          <path
            d="M0,58 C260,35 500,78 780,52 C1040,28 1240,70 1440,55 L1440,90 L0,90 Z"
            fill="#142B4A"
          />
        </svg>
      </div>

      <header className="confirm-topbar">
        <Brand />
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
        <div className="confirm-card">
          <div className="confirm-icon" aria-hidden>
            <IconCheck width={28} height={28} strokeWidth="2.6" />
          </div>

          <h1>Travel details confirmed</h1>
          <p className="confirm-lead">
            Thank you, <strong>{participant.fullName}</strong>. Your travel information is
            with the Consulta travel desk and a copy has been sent to the response inbox.
          </p>

          <div className="confirm-meta">
            <Row
              icon={<IconNote width={15} height={15} />}
              label="Reference"
              value={`CT-${String(participant.id).padStart(5, '0')}`}
            />
            <div className="confirm-meta-row">
              <span>
                <IconClock width={15} height={15} /> Status
              </span>
              <strong>
                <StatusBadge status={participant.status} />
              </strong>
            </div>
            <Row
              icon={<IconUser width={15} height={15} />}
              label="Full Name"
              value={participant.fullName}
            />
            <Row
              icon={<IconMail width={15} height={15} />}
              label="Email"
              value={participant.email}
            />
            <Row
              icon={<IconPhone width={15} height={15} />}
              label="Mobile"
              value={participant.phone}
            />
            <Row
              icon={<IconGlobe width={15} height={15} />}
              label="Country"
              value={participant.country}
            />
            <Row
              icon={<IconTicket width={15} height={15} />}
              label="Flight No."
              value={participant.flightNumber}
            />
            <Row
              icon={<IconPin width={15} height={15} />}
              label="Arrival Airport"
              value={participant.arrivalAirport}
            />
            <Row
              icon={<IconCalendar width={15} height={15} />}
              label="Arrival Date & Time"
              value={
                participant.arrivalDatetime
                  ? formatDateTime(participant.arrivalDatetime)
                  : null
              }
            />
            <Row
              icon={<IconPin width={15} height={15} />}
              label="Departure Airport"
              value={participant.departureAirport}
            />
            <Row
              icon={<IconLanding />}
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

          <div className="confirm-actions">
            <Link className="btn confirm-home-btn" to="/">
              <IconHome />
              Return to Home
            </Link>
            <button
              className="btn confirm-print-btn"
              type="button"
              onClick={() => window.print()}
            >
              <IconPrint />
              Print Confirmation
            </button>
          </div>
        </div>
      </main>

      <footer className="confirm-footer">
        <span className="footer-mail">
          <IconMail width={15} height={15} />
          Responses: jsathishpaul@gmail.com
        </span>
        <span className="confirm-copy">© 2026 Consulta Travel Information</span>
      </footer>
    </div>
  );
}
