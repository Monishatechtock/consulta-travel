import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import LoadingOverlay from '../components/LoadingOverlay';
import {
  IconBuilding,
  IconCalendar,
  IconGlobe,
  IconHeadset,
  IconMail,
  IconNote,
  IconPhone,
  IconPin,
  IconPlane,
  IconSend,
  IconShieldCheck,
  IconTicket,
  IconUser,
} from '../components/Icons';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/landing.css';

const INITIAL = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  organization: '',
  flightNumber: '',
  airline: '',
  arrivalAirport: '',
  arrivalDatetime: '',
  departureAirport: '',
  departureDatetime: '',
  specialRequests: '',
};

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Canada',
  'Australia',
  'Singapore',
  'United Arab Emirates',
  'Brazil',
  'South Africa',
  'Japan',
  'Other',
];

function Field({ id, label, required, error, icon: Icon, children }) {
  return (
    <div className={`field field-iconed ${error ? 'field-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="req">*</span> : null}
      </label>
      <div className="input-with-icon">
        {Icon ? (
          <span className="field-icon" aria-hidden>
            <Icon />
          </span>
        ) : null}
        {children}
      </div>
      {error ? (
        <span className="error-text" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();
  const navigate = useNavigate();

  const update = (key) => (e) => {
    let value = e.target.value;
    if (key === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 12);
    }
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address';
    }
    if (!form.phone.trim()) next.phone = 'Mobile number is required';
    else if (!/^\d{12}$/.test(form.phone.trim())) {
      next.phone = 'Mobile number must be exactly 12 digits';
    }
    if (!form.country.trim()) next.country = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      notify({
        type: 'error',
        title: 'Please review the form',
        message: 'Some required fields need your attention.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.submitParticipant(form);
      notify({
        type: 'success',
        title: 'Submission received',
        message: data.emailDelivered
          ? 'Travel details emailed to the Consulta desk.'
          : 'Saved. Your record is stored.',
      });
      navigate('/confirmation', { state: { participant: data.participant } });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Submission failed',
        message: err.message || 'Please try again shortly.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing landing-fixed landing-exact">
      {submitting ? <LoadingOverlay label="Submitting your travel details…" /> : null}

      <div className="landing-bg" aria-hidden />
      <div className="landing-wash" aria-hidden />
      <div className="landing-plane-layer" aria-hidden>
        <img
          className="landing-plane"
          src="/plane-sky-overlay.jpg"
          alt=""
          draggable="false"
        />
      </div>
      <div className="landing-waves" aria-hidden>
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

      <header className="landing-topbar">
        <Brand />
      </header>

      <main className="landing-stage">
        <section className="landing-copy">
          <h1>
            Consulta Participants –
            <span className="accent-text">Travel Information</span>
          </h1>
          <p className="subtitle">
            Your journey begins with a seamless travel experience.
          </p>

          <ul className="landing-features">
            <li>
              <span className="feature-icon">
                <IconShieldCheck />
              </span>
              <span className="feature-divider" aria-hidden />
              <span>Secure participant travel intake</span>
            </li>
            <li>
              <span className="feature-icon">
                <IconCalendar />
              </span>
              <span className="feature-divider" aria-hidden />
              <span>Arrival & departure coordination</span>
            </li>
            <li>
              <span className="feature-icon">
                <IconHeadset />
              </span>
              <span className="feature-divider" aria-hidden />
              <span>Responses delivered to the travel desk</span>
            </li>
          </ul>
        </section>

        <section className="landing-form-wrap" id="travel-form">
          <form className="mock-form" onSubmit={onSubmit} noValidate>
            <div className="form-card-header">
              <div className="form-title-row">
                <span className="form-tab" aria-hidden>
                  <img src="/logo.svg" alt="" width="28" height="28" />
                </span>
                <div className="form-title-copy">
                  <h2>Travel Details</h2>
                  <p>Complete the form below. Your response is sent to the Consulta desk.</p>
                </div>
              </div>
            </div>

            <div className="form-grid compact three">
              <Field id="fullName" label="Full Name" required error={errors.fullName} icon={IconUser}>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={update('fullName')}
                  placeholder="Passenger name"
                  autoComplete="name"
                />
              </Field>

              <Field id="email" label="Email" required error={errors.email} icon={IconMail}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@organisation.org"
                  autoComplete="email"
                />
              </Field>

              <Field id="phone" label="Mobile" required error={errors.phone} icon={IconPhone}>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{12}"
                  maxLength={12}
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="12-digit mobile number"
                  autoComplete="tel"
                />
              </Field>

              <Field id="country" label="Country" required error={errors.country} icon={IconGlobe}>
                <select id="country" value={form.country} onChange={update('country')}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="organization" label="Organisation" icon={IconBuilding}>
                <input
                  id="organization"
                  value={form.organization}
                  onChange={update('organization')}
                  placeholder="Institution"
                />
              </Field>

              <Field id="airline" label="Airline" icon={IconPlane}>
                <input
                  id="airline"
                  value={form.airline}
                  onChange={update('airline')}
                  placeholder="e.g. Air India"
                  list="airline-suggestions"
                />
                <datalist id="airline-suggestions">
                  {[
                    'Air India',
                    'IndiGo',
                    'Emirates',
                    'Qatar Airways',
                    'Lufthansa',
                    'British Airways',
                    'Singapore Airlines',
                  ].map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </Field>

              <Field id="flightNumber" label="Flight No." icon={IconTicket}>
                <input
                  id="flightNumber"
                  value={form.flightNumber}
                  onChange={update('flightNumber')}
                  placeholder="AI101"
                />
              </Field>

              <Field id="arrivalAirport" label="Arrival Airport" icon={IconPin}>
                <input
                  id="arrivalAirport"
                  value={form.arrivalAirport}
                  onChange={update('arrivalAirport')}
                  placeholder="DEL"
                />
              </Field>

              <Field id="arrivalDatetime" label="Arrival Date & Time" icon={IconCalendar}>
                <input
                  id="arrivalDatetime"
                  type="datetime-local"
                  value={form.arrivalDatetime}
                  onChange={update('arrivalDatetime')}
                />
              </Field>

              <Field id="departureAirport" label="Departure Airport" icon={IconPlane}>
                <input
                  id="departureAirport"
                  value={form.departureAirport}
                  onChange={update('departureAirport')}
                  placeholder="DEL"
                />
              </Field>

              <Field id="departureDatetime" label="Departure Date & Time" icon={IconCalendar}>
                <input
                  id="departureDatetime"
                  type="datetime-local"
                  value={form.departureDatetime}
                  onChange={update('departureDatetime')}
                />
              </Field>

              <Field id="specialRequests" label="Notes" icon={IconNote}>
                <input
                  id="specialRequests"
                  value={form.specialRequests}
                  onChange={update('specialRequests')}
                  placeholder="Assistance or meal notes"
                />
              </Field>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-navy submit-btn" disabled={submitting}>
                <IconSend />
                Submit Travel Information
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="landing-footer-slim">
        <span>© 2026 Consulta Travel Information</span>
        <span className="footer-mail">
          <IconMail width={14} height={14} />
          Responses: sathishpaulj@gmail.com
        </span>
      </footer>
    </div>
  );
}
