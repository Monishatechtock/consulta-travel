import { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge';
import { IconClose } from './Icons';
import { formatDateTime, toDateTimeLocal } from '../utils/format';

const emptyForm = {
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
  status: 'Pending',
};

export default function ParticipantModal({
  mode = 'view',
  participant,
  onClose,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!participant) return;
    setForm({
      fullName: participant.fullName || '',
      email: participant.email || '',
      phone: participant.phone || '',
      country: participant.country || '',
      organization: participant.organization || '',
      flightNumber: participant.flightNumber || '',
      airline: participant.airline || '',
      arrivalAirport: participant.arrivalAirport || '',
      arrivalDatetime: toDateTimeLocal(participant.arrivalDatetime),
      departureAirport: participant.departureAirport || '',
      departureDatetime: toDateTimeLocal(participant.departureDatetime),
      specialRequests: participant.specialRequests || '',
      status: participant.status || 'Pending',
    });
  }, [participant]);

  if (!participant) return null;

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const title = mode === 'edit' ? 'Edit participant' : 'Participant details';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>{title}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              CT-{String(participant.id).padStart(5, '0')}
            </p>
          </div>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="modal-body">
          {mode === 'view' ? (
            <div className="detail-grid">
              <div className="detail-item">
                <span>Name</span>
                <strong>{participant.fullName}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong>
                  <StatusBadge status={participant.status} />
                </strong>
              </div>
              <div className="detail-item">
                <span>Email</span>
                <strong>{participant.email}</strong>
              </div>
              <div className="detail-item">
                <span>Phone</span>
                <strong>{participant.phone || '—'}</strong>
              </div>
              <div className="detail-item">
                <span>Country</span>
                <strong>{participant.country || '—'}</strong>
              </div>
              <div className="detail-item">
                <span>Organisation</span>
                <strong>{participant.organization || '—'}</strong>
              </div>
              <div className="detail-item">
                <span>Flight</span>
                <strong>{participant.flightNumber || '—'}</strong>
              </div>
              <div className="detail-item">
                <span>Airline</span>
                <strong>{participant.airline || '—'}</strong>
              </div>
              <div className="detail-item">
                <span>Arrival</span>
                <strong>
                  {participant.arrivalAirport || '—'}
                  <br />
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {formatDateTime(participant.arrivalDatetime)}
                  </span>
                </strong>
              </div>
              <div className="detail-item">
                <span>Departure</span>
                <strong>
                  {participant.departureAirport || '—'}
                  <br />
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {formatDateTime(participant.departureDatetime)}
                  </span>
                </strong>
              </div>
              <div className="detail-item full">
                <span>Special requests</span>
                <strong>{participant.specialRequests || 'None provided'}</strong>
              </div>
            </div>
          ) : (
            <div className="form-grid two">
              <div className="field">
                <label>Full name</label>
                <input value={form.fullName} onChange={update('fullName')} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={update('email')} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={update('phone')} />
              </div>
              <div className="field">
                <label>Country</label>
                <input value={form.country} onChange={update('country')} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Organisation</label>
                <input value={form.organization} onChange={update('organization')} />
              </div>
              <div className="field">
                <label>Flight number</label>
                <input value={form.flightNumber} onChange={update('flightNumber')} />
              </div>
              <div className="field">
                <label>Airline</label>
                <input value={form.airline} onChange={update('airline')} />
              </div>
              <div className="field">
                <label>Arrival airport</label>
                <input value={form.arrivalAirport} onChange={update('arrivalAirport')} />
              </div>
              <div className="field">
                <label>Arrival date & time</label>
                <input
                  type="datetime-local"
                  value={form.arrivalDatetime}
                  onChange={update('arrivalDatetime')}
                />
              </div>
              <div className="field">
                <label>Departure airport</label>
                <input value={form.departureAirport} onChange={update('departureAirport')} />
              </div>
              <div className="field">
                <label>Departure date & time</label>
                <input
                  type="datetime-local"
                  value={form.departureDatetime}
                  onChange={update('departureDatetime')}
                />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={update('status')}>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Special requests</label>
                <textarea value={form.specialRequests} onChange={update('specialRequests')} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
          {mode === 'edit' ? (
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving}
              onClick={() => onSave(form)}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
