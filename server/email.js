const nodemailer = require('nodemailer');

const RESPONSE_EMAIL =
  process.env.NOTIFY_ADMIN_EMAIL || 'sathishpaulj@gmail.com';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] SMTP is not fully configured (SMTP_HOST / SMTP_USER / SMTP_PASS).');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const from = process.env.SMTP_FROM || 'Consulta Travel <info@cbciedubase.org>';
  const transport = createTransport();

  if (!transport) {
    console.log('[email:dev]', { to, subject, text: text || html?.slice(0, 200) });
    return { queued: false, mocked: true };
  }

  const info = await transport.sendMail({
    from,
    to,
    subject,
    html,
    text,
    replyTo,
  });

  console.log('[email:sent]', { to, messageId: info.messageId });
  return { queued: true, mocked: false, messageId: info.messageId };
}

function buildSubmissionHtml(participant) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#263445;line-height:1.6">
      <div style="background:#142B4A;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;font-size:18px">Consulta Travel Information</h2>
        <p style="margin:6px 0 0;opacity:.85;font-size:13px">New participant response</p>
      </div>
      <div style="border:1px solid #e5eaf0;border-top:0;padding:18px 20px;border-radius:0 0 10px 10px">
        <p style="margin-top:0">A participant submitted travel information. Full response details below.</p>
        <table style="border-collapse:collapse;width:100%;max-width:560px;margin:12px 0 8px">
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.full_name)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.email)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Phone</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.phone || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Country</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.country || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Organisation</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.organization || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Flight</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.flight_number || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Airline</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.airline || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Arrival airport</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.arrival_airport || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Arrival</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(formatDt(participant.arrival_datetime))}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Departure airport</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.departure_airport || '—')}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Departure</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(formatDt(participant.departure_datetime))}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5eaf0"><strong>Special requests</strong></td><td style="padding:8px;border-bottom:1px solid #e5eaf0">${escapeHtml(participant.special_requests || '—')}</td></tr>
          <tr><td style="padding:8px"><strong>Status</strong></td><td style="padding:8px">${escapeHtml(participant.status)}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px;margin-bottom:0">Consulta Travel Information Desk</p>
      </div>
    </div>
  `;
}

async function notifyParticipantSubmission(participant) {
  return sendMail({
    to: RESPONSE_EMAIL,
    replyTo: participant.email,
    subject: `Consulta travel response – ${participant.full_name}`,
    html: buildSubmissionHtml(participant),
  });
}

async function notifyAdminNewSubmission(participant) {
  return notifyParticipantSubmission(participant);
}

function formatDt(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  sendMail,
  notifyParticipantSubmission,
  notifyAdminNewSubmission,
  RESPONSE_EMAIL,
};
