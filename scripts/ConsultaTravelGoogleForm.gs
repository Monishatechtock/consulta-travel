/**
 * Consulta Travel Information — Google Form + email notify
 *
 * SETUP:
 * 1) Go to https://script.google.com → New project
 * 2) Delete any default code, paste THIS whole file
 * 3) Set NOTIFY emails below
 * 4) Run: createConsultaTravelForm  (Authorize when asked)
 * 5) Run: installSubmitTrigger
 * 6) Open the Form URL printed in Logs (View → Logs)
 *
 * Form submissions will email the notify addresses.
 * The form itself does NOT show the hidden extra email.
 */

// Shown / primary inbox
var NOTIFY_ADMIN_EMAIL = 'jsathishpaul@gmail.com';

// Hidden extra recipient (not shown on any public form text)
var NOTIFY_EXTRA_EMAILS = ['brijithmonisha@dbcyelagiri.edu.in'];

var FORM_TITLE = 'Consulta Participants Travel Information';
var FORM_DESCRIPTION =
  'Complete the form below. Your response is sent to the Consulta desk.';

/**
 * Creates the Google Form with the same fields as the web app.
 */
function createConsultaTravelForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION);
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Submission received. Thank you — your travel request has been received successfully.'
  );

  form
    .addTextItem()
    .setTitle('Full Name')
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('Email')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextIsEmail()
        .setHelpText('Enter a valid email address')
        .build()
    );

  form
    .addTextItem()
    .setTitle('Mobile')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern('^[0-9]+$')
        .setHelpText('Numbers only')
        .build()
    );

  form
    .addListItem()
    .setTitle('Country')
    .setChoiceValues([
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
      'Dominican Republic',
      'Togo',
      'Philippines',
      'Malta',
      'Poland',
      'Argentina',
      'Kenya',
      'Nigeria',
      'Other',
    ])
    .setRequired(true);

  form.addTextItem().setTitle('Flight No.').setRequired(false);
  form.addTextItem().setTitle('Arrival Airport').setRequired(false);
  form
    .addDateTimeItem()
    .setTitle('Arrival Date & Time')
    .setRequired(false);
  form.addTextItem().setTitle('Departure Airport').setRequired(false);
  form
    .addDateTimeItem()
    .setTitle('Departure Date & Time')
    .setRequired(false);
  form.addParagraphTextItem().setTitle('Notes').setRequired(false);

  // Remember form id for the trigger helper
  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId());

  Logger.log('Form created successfully');
  Logger.log('Edit URL: ' + form.getEditUrl());
  Logger.log('Public URL: ' + form.getPublishedUrl());
  Logger.log('Form ID: ' + form.getId());
}

/**
 * Installs an on-form-submit trigger for the form created above.
 */
function installSubmitTrigger() {
  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!formId) {
    throw new Error('Run createConsultaTravelForm first.');
  }

  // Remove old triggers for this function
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onConsultaFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onConsultaFormSubmit')
    .forForm(formId)
    .onFormSubmit()
    .create();

  Logger.log('Submit trigger installed for form: ' + formId);
}

/**
 * Sends email when someone submits the Google Form.
 */
function onConsultaFormSubmit(e) {
  var named = e.namedValues || {};
  function val(title) {
    var v = named[title];
    if (!v || !v.length) return '—';
    var s = String(v[0] || '').trim();
    return s || '—';
  }

  var fullName = val('Full Name');
  var email = val('Email');
  var phone = val('Mobile');
  var country = val('Country');
  var flightNo = val('Flight No.');
  var arrivalAirport = val('Arrival Airport');
  var arrivalDt = val('Arrival Date & Time');
  var departureAirport = val('Departure Airport');
  var departureDt = val('Departure Date & Time');
  var notes = val('Notes');

  var subject = 'Consulta travel response – ' + fullName;

  var html =
    '<div style="font-family:Segoe UI,Arial,sans-serif;color:#263445;line-height:1.6">' +
    '<div style="background:#142B4A;color:#fff;padding:16px 20px">' +
    '<h2>Consulta Travel Information</h2>' +
    '<p>New participant response (Google Form)</p>' +
    '</div>' +
    '<div style="border:1px solid #e5eaf0;padding:18px 20px">' +
    '<table style="border-collapse:collapse;width:100%">' +
    row('Name', fullName) +
    row('Email', email) +
    row('Phone', phone) +
    row('Country', country) +
    row('Flight', flightNo) +
    row('Arrival airport', arrivalAirport) +
    row('Arrival', arrivalDt) +
    row('Departure airport', departureAirport) +
    row('Departure', departureDt) +
    row('Special requests', notes) +
    '</table>' +
    '<p>Consulta Travel Information Desk</p>' +
    '</div></div>';

  var recipients = [NOTIFY_ADMIN_EMAIL]
    .concat(NOTIFY_EXTRA_EMAILS || [])
    .filter(function (x) {
      return x && String(x).indexOf('@') !== -1;
    });

  // Unique list
  recipients = recipients.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });

  MailApp.sendEmail({
    to: recipients.join(','),
    replyTo: email !== '—' ? email : undefined,
    subject: subject,
    htmlBody: html,
  });
}

function row(label, value) {
  return (
    '<tr><td style="padding:4px 8px"><strong>' +
    escapeHtml(label) +
    '</strong></td><td style="padding:4px 8px">' +
    escapeHtml(value) +
    '</td></tr>'
  );
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Optional: send a test email (run manually once).
 */
function sendTestNotifyEmail() {
  MailApp.sendEmail({
    to: NOTIFY_ADMIN_EMAIL,
    subject: 'Consulta Travel Google Form – test',
    htmlBody: '<p>Test email from Consulta Travel Google Form Apps Script.</p>',
  });
  Logger.log('Test email sent to ' + NOTIFY_ADMIN_EMAIL);
}
