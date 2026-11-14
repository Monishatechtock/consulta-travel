import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import ParticipantModal from '../components/ParticipantModal';
import StatusBadge from '../components/StatusBadge';
import {
  IconCheck,
  IconClock,
  IconDownload,
  IconEdit,
  IconEye,
  IconPrint,
  IconSearch,
  IconUsers,
} from '../components/Icons';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { downloadBlob, formatDateTime } from '../utils/format';
import '../styles/admin.css';

export default function AdminDashboardPage() {
  const { notify } = useToast();
  const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0 });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'view', participant: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        api.getStats(),
        api.getParticipants({ q: debouncedQuery, status: statusFilter }),
      ]);
      setStats(statsRes);
      setParticipants(listRes.participants || []);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Unable to load dashboard',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, statusFilter, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = async (mode, id) => {
    try {
      const { participant } = await api.getParticipant(id);
      setModal({ open: true, mode, participant });
    } catch (err) {
      notify({ type: 'error', title: 'Unable to open record', message: err.message });
    }
  };

  const onSave = async (form) => {
    if (!modal.participant) return;
    setSaving(true);
    try {
      await api.updateParticipant(modal.participant.id, form);
      notify({
        type: 'success',
        title: 'Participant updated',
        message: 'Changes were saved successfully.',
      });
      setModal({ open: false, mode: 'view', participant: null });
      await loadData();
    } catch (err) {
      notify({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    try {
      const blob = await api.exportCsv({ q: debouncedQuery, status: statusFilter });
      downloadBlob(blob, `consulta-travel-report-${new Date().toISOString().slice(0, 10)}.csv`);
      notify({
        type: 'success',
        title: 'Export ready',
        message: 'CSV travel report downloaded.',
      });
    } catch (err) {
      notify({ type: 'error', title: 'Export failed', message: err.message });
    }
  };

  const printRows = useMemo(() => participants, [participants]);

  return (
    <div className="admin-shell">
      <AdminHeader />
      {loading ? <LoadingOverlay label="Preparing dashboard…" /> : null}

      <main className="dashboard-page">
        <div className="container">
          <div className="dashboard-intro no-print">
            <div>
              <h1>Administrator dashboard</h1>
              <p>Monitor participant submissions and coordinate travel arrivals.</p>
            </div>
            <div className="dashboard-actions">
              <button className="btn btn-ghost" type="button" onClick={onExport}>
                <IconDownload />
                <span>Export CSV</span>
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
                <IconPrint />
                <span>Print report</span>
              </button>
            </div>
          </div>

          <section className="stats-grid no-print" aria-label="Summary">
            <article className="stat-card total">
              <div className="stat-icon">
                <IconUsers />
              </div>
              <div>
                <div className="value">{stats.total}</div>
                <div className="label">Total Participants</div>
              </div>
            </article>
            <article className="stat-card submitted">
              <div className="stat-icon">
                <IconCheck />
              </div>
              <div>
                <div className="value">{stats.submitted}</div>
                <div className="label">Submitted</div>
              </div>
            </article>
            <article className="stat-card pending">
              <div className="stat-icon">
                <IconClock />
              </div>
              <div>
                <div className="value">{stats.pending}</div>
                <div className="label">Pending</div>
              </div>
            </article>
          </section>

          <section className="panel print-report">
            <div className="print-only print-report-header">
              <div>
                <h2>Consulta Travel Report</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Participant travel information summary
                </p>
              </div>
              <div className="print-report-meta">
                <div>Generated {new Date().toLocaleString()}</div>
                <div>
                  Filter: {statusFilter === 'all' ? 'All statuses' : statusFilter}
                  {debouncedQuery ? ` · Search: ${debouncedQuery}` : ''}
                </div>
              </div>
            </div>

            <div className="panel-toolbar no-print">
              <div className="toolbar-left">
                <div className="search-field">
                  <IconSearch />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, flight, airline…"
                    aria-label="Search participants"
                  />
                </div>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="toolbar-right">
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {participants.length} record{participants.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {participants.length === 0 && !loading ? (
              <EmptyState
                title="No participants yet"
                message={
                  debouncedQuery || statusFilter !== 'all'
                    ? 'No records match your current search or filter.'
                    : 'When participants submit travel details, they will appear here.'
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Participant Name</th>
                      <th>Flight Number</th>
                      <th>Airline</th>
                      <th>Arrival</th>
                      <th>Departure</th>
                      <th>Status</th>
                      <th className="no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printRows.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="name-cell">{p.fullName}</div>
                          <div className="muted">{p.email}</div>
                        </td>
                        <td>{p.flightNumber || '—'}</td>
                        <td>{p.airline || '—'}</td>
                        <td>
                          <div>{formatDateTime(p.arrivalDatetime)}</div>
                          <div className="muted">{p.arrivalAirport || ''}</div>
                        </td>
                        <td>
                          <div>{formatDateTime(p.departureDatetime)}</div>
                          <div className="muted">{p.departureAirport || ''}</div>
                        </td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="no-print">
                          <div className="row-actions">
                            <button
                              className="btn btn-icon"
                              type="button"
                              title="View"
                              aria-label={`View ${p.fullName}`}
                              onClick={() => openModal('view', p.id)}
                            >
                              <IconEye />
                            </button>
                            <button
                              className="btn btn-icon"
                              type="button"
                              title="Edit"
                              aria-label={`Edit ${p.fullName}`}
                              onClick={() => openModal('edit', p.id)}
                            >
                              <IconEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {modal.open ? (
        <ParticipantModal
          mode={modal.mode}
          participant={modal.participant}
          saving={saving}
          onClose={() => setModal({ open: false, mode: 'view', participant: null })}
          onSave={onSave}
        />
      ) : null}
    </div>
  );
}
