const User = require('../models/User');
const { trimiteCatreUser, verificaUser } = require('../services/pushService');

// Cheia publică VAPID — frontend-ul o folosește la abonare
const getVapidKey = (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || '' });
};

// Salvează abonamentul push al dispozitivului și activează notificările
const subscribe = async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ mesaj: 'Abonament invalid' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ mesaj: 'Utilizator negăsit' });

    // Evită duplicatele după endpoint
    const existente = (user.pushSubscriptions || []).filter(s => s.endpoint !== sub.endpoint);
    user.pushSubscriptions = [...existente, { endpoint: sub.endpoint, keys: sub.keys }];
    user.setari = { ...user.setari, notificariActive: true };
    await user.save();

    res.json({ mesaj: 'Notificări activate', notificariActive: true });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Dezabonează dispozitivul (sau toate) și dezactivează notificările
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ mesaj: 'Utilizator negăsit' });

    user.pushSubscriptions = endpoint
      ? (user.pushSubscriptions || []).filter(s => s.endpoint !== endpoint)
      : [];
    user.setari = { ...user.setari, notificariActive: false };
    await user.save();

    res.json({ mesaj: 'Notificări dezactivate', notificariActive: false });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Trimite o notificare de test (pentru verificare imediată)
const testNotificare = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(user.pushSubscriptions || []).length) {
      return res.status(400).json({ mesaj: 'Nu există niciun dispozitiv abonat' });
    }
    await trimiteCatreUser(user, {
      titlu: 'Test notificare ✅',
      corp: 'Notificările funcționează! Vei fi anunțat când expiră un document.',
      url: '/notificari'
    });
    res.json({ mesaj: 'Notificare de test trimisă' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// TEMPORAR (demo licență): declanșează manual verificarea expirărilor pentru
// utilizatorul curent, ca să nu aștepți cron-ul de la ora 09:00.
const verificaAcum = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(user.pushSubscriptions || []).length) {
      return res.status(400).json({ mesaj: 'Nu există niciun dispozitiv abonat' });
    }
    const trimise = await verificaUser(user, { fortat: true });
    res.json({ trimise });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { getVapidKey, subscribe, unsubscribe, testNotificare, verificaAcum };
