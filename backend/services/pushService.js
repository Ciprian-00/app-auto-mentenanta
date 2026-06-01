const webpush = require('web-push');
const User = require('../models/User');
const Reminder = require('../models/Reminder');

// Configurează cheile VAPID (din .env)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:exemplu@exemplu.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const ZI_MS = 1000 * 60 * 60 * 24;

// Trimite o notificare către toate abonamentele unui utilizator.
// Abonamentele expirate (404/410) sunt eliminate automat.
const trimiteCatreUser = async (user, payload) => {
  const data = JSON.stringify(payload);
  const subs = user.pushSubscriptions || [];
  const valide = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, data);
      valide.push(sub);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) continue; // abonament mort
      valide.push(sub); // eroare temporară — păstrăm abonamentul
    }
  }

  if (valide.length !== subs.length) {
    user.pushSubscriptions = valide;
    await user.save();
  }
};

// Verifică reminderele unui utilizator și trimite push pentru cele care expiră
// în pragul ales. Cu fortat=true trimite chiar dacă a fost deja notificat azi.
// Întoarce câte notificări a trimis.
const verificaUser = async (user, { fortat = false } = {}) => {
  const acum = new Date();
  const azi = acum.toISOString().split('T')[0];

  const remindere = await Reminder.find({ utilizator: user._id, dismissed: false })
    .populate('vehicul', 'marca model');

  let trimise = 0;
  for (const r of remindere) {
    const zile = Math.ceil((new Date(r.dataExpirare) - acum) / ZI_MS);
    if (zile > r.zileInainte) continue; // încă nu e cazul
    if (!fortat && r.notificatLa && new Date(r.notificatLa).toISOString().split('T')[0] === azi) continue; // deja azi

    const titlu = zile < 0 ? `${r.tip} expirat` : `${r.tip} expiră curând`;
    const corp = r.mesaj || `${r.tip} pentru ${r.vehicul?.marca || ''} ${r.vehicul?.model || ''}`.trim();
    await trimiteCatreUser(user, { titlu, corp, url: '/notificari' });

    r.notificatLa = acum;
    await r.save();
    trimise++;
  }
  return trimise;
};

// Rulat zilnic de cron: verifică toți utilizatorii cu notificări active.
const verificaSiTrimite = async () => {
  const utilizatori = await User.find({
    'setari.notificariActive': true,
    'pushSubscriptions.0': { $exists: true }
  });
  for (const user of utilizatori) await verificaUser(user);
};

module.exports = { trimiteCatreUser, verificaUser, verificaSiTrimite };
