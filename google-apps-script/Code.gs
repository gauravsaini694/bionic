/**
 * Bionic — Contact form receiver (Google Apps Script Web App)
 *
 * What it does on every form submission:
 *   1. Saves the submission as a new row in the Google Sheet ("Contact Requests" tab)
 *   2. Emails the full details to NOTIFY_EMAIL (information@bionicpo.com)
 *   3. (Optional) Sends a short "we received your request" email to the visitor
 *
 * Setup: create a Google Sheet → Extensions → Apps Script → paste this file →
 *        Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone)
 *        → copy the /exec URL into the form's action attribute.
 */

const NOTIFY_EMAIL    = 'information@bionicpo.com';
const SHEET_NAME      = 'Contact Requests';
const SEND_AUTO_REPLY = true;            // set false to stop the confirmation email to visitors
const COMPANY_NAME    = 'Bionic Prosthetics & Orthotics';
const COMPANY_PHONE   = '1-855-524-6642';

// Column order in the sheet: [form field name, column header]
const FIELDS = [
  ['contact_role',      'I am a'],
  ['first_name',        'First Name'],
  ['last_name',         'Last Name'],
  ['email',             'Email'],
  ['phone',             'Phone'],
  ['preferred_contact', 'Preferred Contact'],
  ['reason',            'Reason'],
  ['service',           'Service'],
  ['patient_age_group', 'Patient Age Group'],
  ['has_prescription',  'Has Prescription'],
  ['state',             'State'],
  ['zip',               'ZIP'],
  ['insurance',         'Insurance'],
  ['best_time',         'Best Time'],
  ['referral_source',   'Heard About Us'],
  ['message',           'Message'],
  ['consent',           'Consent'],
  ['newsletter',        'Newsletter'],
  ['page_url',          'Page URL'],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const p = (e && e.parameter) || {};

    // Spam trap: real visitors never fill this hidden field
    if (p.company_website) return json({ ok: true });

    // Basic server-side validation
    const required = ['first_name', 'last_name', 'email', 'phone', 'reason', 'service', 'state', 'zip', 'consent'];
    const missing = required.filter(k => !String(p[k] || '').trim());
    if (missing.length) return json({ ok: false, error: 'Missing: ' + missing.join(', ') });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return json({ ok: false, error: 'Invalid email' });

    const now = new Date();
    const sheet = getSheet_();
    sheet.appendRow([now].concat(FIELDS.map(([k]) => safeCell_(p[k]))));

    sendNotification_(p, now);
    if (SEND_AUTO_REPLY) sendAutoReply_(p);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Server error' });
  } finally {
    lock.releaseLock();
  }
}

// Quick check in the browser: opening the /exec URL should show {"ok":true,"status":"running"}
function doGet() {
  return json({ ok: true, status: 'running' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Submitted At'].concat(FIELDS.map(f => f[1])));
    sheet.getRange(1, 1, 1, FIELDS.length + 1)
      .setFontWeight('bold').setBackground('#25318D').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendNotification_(p, now) {
  const name = (p.first_name + ' ' + p.last_name).trim();
  const rows = FIELDS
    .filter(([k]) => p[k])
    .map(([k, label]) =>
      '<tr><td style="padding:8px 12px;background:#F4F4F4;font-weight:600;width:180px;vertical-align:top">' + esc_(label) +
      '</td><td style="padding:8px 12px;white-space:pre-wrap">' + esc_(p[k]) + '</td></tr>')
    .join('');

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#000">' +
    '<h2 style="color:#25318D;margin:0 0 4px">New Consultation Request</h2>' +
    '<p style="margin:0 0 16px;color:#555">Received ' + esc_(now.toLocaleString('en-US')) + '</p>' +
    '<table style="border-collapse:collapse;border:1px solid #ddd;width:100%;max-width:640px">' + rows + '</table>' +
    '<p style="margin-top:16px;color:#555">Reply to this email to respond directly to ' + esc_(name) + '.</p></div>';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: p.email,
    name: 'Bionic Website',
    subject: 'New Consultation Request – ' + name + ' (' + (p.service || 'General') + ', ' + (p.state || '') + ')',
    htmlBody: html,
  });
}

function sendAutoReply_(p) {
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#000;line-height:1.6">' +
    '<p>Hi ' + esc_(p.first_name) + ',</p>' +
    '<p>Thank you for contacting ' + COMPANY_NAME + '. We\'ve received your request and a member of our ' +
    'patient care team will reach out within one business day.</p>' +
    '<p>Need help sooner? Call us at <b>' + COMPANY_PHONE + '</b>.</p>' +
    '<p>Warm regards,<br>' + COMPANY_NAME + '</p></div>';

  MailApp.sendEmail({
    to: p.email,
    replyTo: NOTIFY_EMAIL,
    name: COMPANY_NAME,
    subject: 'We received your request – ' + COMPANY_NAME,
    htmlBody: html,
  });
}

// Stop values like "=HYPERLINK(...)" from being run as spreadsheet formulas
function safeCell_(v) {
  v = String(v == null ? '' : v).slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
