// Mailing-list signup endpoint. Deployed as a Google Apps Script web app bound
// to the signup Sheet; see docs/subscribe.md for setup.
//
// Apps Script web apps always answer 200, so the outcome is in the body:
// { ok: true } or { ok: false, error: 'captcha' | 'email' }.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const email = String(e.parameter.email || '')
    .trim()
    .toLowerCase();
  const token = String(e.parameter['h-captcha-response'] || '');

  if (!EMAIL_PATTERN.test(email)) return reply({ ok: false, error: 'email' });
  if (!captchaPassed(token)) return reply({ ok: false, error: 'captcha' });

  addSubscriber(email);
  return reply({ ok: true });
}

function captchaPassed(token) {
  if (!token) return false;
  const secret = PropertiesService.getScriptProperties().getProperty('HCAPTCHA_SECRET');
  const res = UrlFetchApp.fetch('https://api.hcaptcha.com/siteverify', {
    method: 'post',
    payload: { secret: secret, response: token },
    muteHttpExceptions: true,
  });
  return JSON.parse(res.getContentText()).success === true;
}

function addSubscriber(email) {
  // Two signups at once could both pass the duplicate check without the lock.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const existing = sheet
      .getRange('B:B')
      .getValues()
      .map((row) => row[0]);
    if (!existing.includes(email)) sheet.appendRow([new Date(), email]);
  } finally {
    lock.releaseLock();
  }
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
