const RESPONSE_EMAIL = process.env.NOTIFY_ADMIN_EMAIL;

async function sendMail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is missing');
    return { queued: false, mocked: true };
  }

  if (!to) {
    console.error('[email] NOTIFY_ADMIN_EMAIL is missing');
    return { queued: false, mocked: true };
  }

  const from =
    process.env.RESEND_FROM || 'Consulta Travel <onboarding@resend.dev>';

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

  const result = await response.json();

  if (!response.ok) {
    console.error('[email] Resend error:', result);
    throw new Error(result.message || 'Email delivery failed');
  }

  console.log('[email:sent]', { messageId: result.id });

  return {
    queued: true,
    mocked: false,
    messageId: result.id,
  };
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
          <tr><td><strong>Organisation</strong></td><td>${escapeHtml(participant.organization || '—')}</td></tr>
          <tr><td><strong>Flight</strong></td><td>${escapeHtml(participant.flight_number || '—')}</td></tr>
          <tr><td><strong>Airline</strong></td><td>${escapeHtml(participant.airline || '—')}</td></tr>
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
