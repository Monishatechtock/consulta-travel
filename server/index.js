require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { notifyParticipantSubmission } = require('./email');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Prefer server/public (Render build copy), fallback to client/dist (local)
const publicDirCandidates = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'client', 'dist'),
];
const clientDist =
  publicDirCandidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) ||
  publicDirCandidates[0];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function mapParticipant(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    organization: row.organization,
    flightNumber: row.flight_number,
    airline: row.airline,
    arrivalAirport: row.arrival_airport,
    arrivalDatetime: row.arrival_datetime,
    departureAirport: row.departure_airport,
    departureDatetime: row.departure_datetime,
    specialRequests: row.special_requests,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateParticipant(body) {
  const errors = [];
  if (!body.fullName || String(body.fullName).trim() === '') {
    errors.push('Full name is required');
  }
  if (!body.email || String(body.email).trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Email format is invalid');
  }
  if (!body.phone || String(body.phone).trim() === '') {
    errors.push('Mobile number is required');
  } else if (!/^\d+$/.test(String(body.phone).trim())) {
    errors.push('Mobile number must contain only numbers');
  }
  if (!body.country || String(body.country).trim() === '') {
    errors.push('Country is required');
  }
  return errors;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Consulta Travel API',
    frontend: fs.existsSync(path.join(clientDist, 'index.html')),
    publicPath: clientDist,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign(
    { id: admin.id, username: admin.username, displayName: admin.display_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.display_name,
    },
  });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ admin: req.admin });
});

app.post('/api/participants', async (req, res) => {
  const body = req.body || {};
  const errors = validateParticipant(body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const status =
    body.flightNumber && body.airline && body.arrivalDatetime ? 'Submitted' : 'Pending';

  const info = db
    .prepare(
      `INSERT INTO participants (
        full_name, email, phone, country, organization,
        flight_number, airline, arrival_airport, arrival_datetime,
        departure_airport, departure_datetime, special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.fullName.trim(),
      body.email.trim().toLowerCase(),
      body.phone?.trim() || null,
      body.country?.trim() || null,
      body.organization?.trim() || null,
      body.flightNumber?.trim() || null,
      body.airline?.trim() || null,
      body.arrivalAirport?.trim() || null,
      body.arrivalDatetime || null,
      body.departureAirport?.trim() || null,
      body.departureDatetime || null,
      body.specialRequests?.trim() || null,
      status
    );

  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(info.lastInsertRowid);
  const participant = mapParticipant(row);

  let emailDelivered = false;
  try {
    const mailResult = await notifyParticipantSubmission(row);
    emailDelivered = Boolean(mailResult && mailResult.queued && !mailResult.mocked);
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }

  res.status(201).json({
    participant,
    emailDelivered,
    message: emailDelivered
      ? 'Travel information submitted and emailed successfully'
      : 'Travel information submitted successfully',
  });
});

app.get('/api/admin/stats', authRequired, (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM participants').get().c;
  const submitted = db
    .prepare(`SELECT COUNT(*) AS c FROM participants WHERE status = 'Submitted'`)
    .get().c;
  const pending = db
    .prepare(`SELECT COUNT(*) AS c FROM participants WHERE status = 'Pending'`)
    .get().c;
  res.json({ total, submitted, pending });
});

app.get('/api/admin/participants', authRequired, (req, res) => {
  const { q = '', status = 'all' } = req.query;
  let sql = 'SELECT * FROM participants WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (q && String(q).trim()) {
    sql += ` AND (
      full_name LIKE ? OR email LIKE ? OR flight_number LIKE ?
      OR airline LIKE ? OR organization LIKE ? OR country LIKE ?
    )`;
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like, like, like, like);
  }
  sql += ' ORDER BY datetime(created_at) DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ participants: rows.map(mapParticipant) });
});

app.get('/api/admin/participants/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Participant not found' });
  res.json({ participant: mapParticipant(row) });
});

app.put('/api/admin/participants/:id', authRequired, (req, res) => {
  const existing = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Participant not found' });

  const body = req.body || {};
  const errors = validateParticipant({
    fullName: body.fullName ?? existing.full_name,
    email: body.email ?? existing.email,
    phone: body.phone ?? existing.phone,
    country: body.country ?? existing.country,
  });
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const nextStatus =
    body.status === 'Pending' || body.status === 'Submitted'
      ? body.status
      : existing.status;

  db.prepare(
    `UPDATE participants SET
      full_name = ?, email = ?, phone = ?, country = ?, organization = ?,
      flight_number = ?, airline = ?, arrival_airport = ?, arrival_datetime = ?,
      departure_airport = ?, departure_datetime = ?, special_requests = ?,
      status = ?, updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    (body.fullName ?? existing.full_name).trim(),
    (body.email ?? existing.email).trim().toLowerCase(),
    body.phone !== undefined ? body.phone?.trim() || null : existing.phone,
    body.country !== undefined ? body.country?.trim() || null : existing.country,
    body.organization !== undefined
      ? body.organization?.trim() || null
      : existing.organization,
    body.flightNumber !== undefined
      ? body.flightNumber?.trim() || null
      : existing.flight_number,
    body.airline !== undefined ? body.airline?.trim() || null : existing.airline,
    body.arrivalAirport !== undefined
      ? body.arrivalAirport?.trim() || null
      : existing.arrival_airport,
    body.arrivalDatetime !== undefined ? body.arrivalDatetime || null : existing.arrival_datetime,
    body.departureAirport !== undefined
      ? body.departureAirport?.trim() || null
      : existing.departure_airport,
    body.departureDatetime !== undefined
      ? body.departureDatetime || null
      : existing.departure_datetime,
    body.specialRequests !== undefined
      ? body.specialRequests?.trim() || null
      : existing.special_requests,
    nextStatus,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  res.json({ participant: mapParticipant(row), message: 'Participant updated' });
});

app.delete('/api/admin/participants/:id', authRequired, (req, res) => {
  const info = db.prepare('DELETE FROM participants WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ message: 'Participant not found' });
  res.json({ message: 'Participant deleted' });
});

app.get('/api/admin/export', authRequired, (req, res) => {
  const { status = 'all', q = '' } = req.query;
  let sql = 'SELECT * FROM participants WHERE 1=1';
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (q && String(q).trim()) {
    sql += ` AND (full_name LIKE ? OR email LIKE ? OR flight_number LIKE ? OR airline LIKE ?)`;
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY datetime(created_at) DESC';
  const rows = db.prepare(sql).all(...params);

  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Country',
    'Organization',
    'Flight Number',
    'Airline',
    'Arrival Airport',
    'Arrival DateTime',
    'Departure Airport',
    'Departure DateTime',
    'Special Requests',
    'Status',
    'Created At',
  ];

  const escapeCsv = (value) => {
    const s = value == null ? '' : String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.full_name,
        r.email,
        r.phone,
        r.country,
        r.organization,
        r.flight_number,
        r.airline,
        r.arrival_airport,
        r.arrival_datetime,
        r.departure_airport,
        r.departure_datetime,
        r.special_requests,
        r.status,
        r.created_at,
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="consulta-travel-report-${stamp}.csv"`
  );
  res.send('\uFEFF' + lines.join('\n'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

// Serve React build
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.log('Serving frontend from:', clientDist);
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn('Frontend build missing at:', clientDist);
  app.get('/', (_req, res) => {
    res
      .status(200)
      .send(
        'Consulta API is running, but frontend build is missing. Check Render build logs for "npm run render-build".'
      );
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Consulta Travel app listening on http://0.0.0.0:${PORT}`);
});
