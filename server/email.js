const nodemailer = require('nodemailer');

function env(name, fallback = '') {
  const value = process.env[name];
  if (value == null) return fallback;
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

const RESPONSE_EMAIL = env('NOTIFY_ADMIN_EMAIL');

async function sendViaResend({ to, subject, html, text, replyTo }) {
  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) return null;

  const from = env('RESEND_FROM', 'Consulta Travel <onboarding@resend.dev>');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[email] Resend error status=', response.status);
    throw new Error(result.message || 'Resend email delivery failed');
  }

  console.log('[email:sent:resend]', { messageId: result.id });
  return { queued: true, mocked: false, messageId: result.id, provider: 'resend' };
}

function createSmtpTransport() {
  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(env('SMTP_PORT', '587')),
    secure: env('SMTP_SECURE') === 'true',
    auth: { user, pass },
  });
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  const transport = createSmtpTransport();
  if (!transport) return null;

  const user = env('SMTP_USER');
  const from = env('SMTP_FROM', `Consulta Travel <${user}>`);

  try {
    await transport.verify();
  } catch (err) {
    console.error('[email] SMTP verify failed:', err.message);
    throw new Error(`SMTP connection failed: ${err.message}`);
  }

  const info = await transport.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    replyTo,
  });

  console.log('[email:sent:smtp]', { messageId: info.messageId, accepted: info.accepted });
  return {
    queued: true,
    mocked: false,
    messageId: info.messageId,
    provider: 'smtp',
  };
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const destination = String(to || '').trim();
  if (!destination) {
    console.error('[email] NOTIFY_ADMIN_EMAIL is missing');
    return { queued: false, mocked: true };
  }

  try {
    const viaResend = await sendViaResend({
      to: destination,
      subject,
      html,
      text,
      replyTo,
    });
    if (viaResend) return viaResend;
  } catch (err) {
    console.error('[email] Resend failed, trying SMTP:', err.message);
  }

  const viaSmtp = await sendViaSmtp({
    to: destination,
    subject,
    html,
    text,
    replyTo,
  });
  if (viaSmtp) return viaSmtp;

  console.error('[email] No email provider configured (RESEND_API_KEY or SMTP_*)');
  return { queued: false, mocked: true };
}

function buildSubmissionHtml(participant) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#263445;line-height:1.6">
      <div style="background:#142B4A;color:#fff;padding:16px 20px">
        <h2>Consulta Travel Information</h2>
        <p>New participant response</p>
      </div>
      <div style="border:1px solid #e5eaf0;padding:18px 20px">
        <p>A participant submitted travel information.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(participant.full_name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(participant.email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(participant.phone || '—')}</td></tr>
          <tr><td><strong>Country</strong></td><td>${escapeHtml(participant.country || '—')}</td></tr>
          <tr><td><strong>Flight</strong></td><td>${escapeHtml(participant.flight_number || '—')}</td></tr>
          <tr><td><strong>Arrival airport</strong></td><td>${escapeHtml(participant.arrival_airport || '—')}</td></tr>
          <tr><td><strong>Arrival</strong></td><td>${escapeHtml(formatDt(participant.arrival_datetime))}</td></tr>
          <tr><td><strong>Departure airport</strong></td><td>${escapeHtml(participant.departure_airport || '—')}</td></tr>
          <tr><td><strong>Departure</strong></td><td>${escapeHtml(formatDt(participant.departure_datetime))}</td></tr>
          <tr><td><strong>Special requests</strong></td><td>${escapeHtml(participant.special_requests || '—')}</td></tr>
          <tr><td><strong>Status</strong></td><td>${escapeHtml(participant.status || 'Submitted')}</td></tr>
        </table>
        <p>Consulta Travel Information Desk</p>
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
