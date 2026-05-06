const Reminder = require('../models/Reminder');
const { genereazaRemindere, getRemindereActive } = require('../services/reminderService');

// Toate remindere utilizator cu status
const getRemindere = async (req, res) => {
  try {
    // Regenereaza remindere bazate pe vehiculele curente
    const Vehicle = require('../models/Vehicle');
    const vehicule = await Vehicle.find({ utilizator: req.user.id });
    
    for (const vehicul of vehicule) {
      await genereazaRemindere(vehicul._id, req.user.id);
    }

    const remindere = await getRemindereActive(req.user.id);
    res.json(remindere);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Genereaza remindere pentru un vehicul
const genereaza = async (req, res) => {
  try {
    await genereazaRemindere(req.params.vehiculId, req.user.id);
    res.json({ mesaj: 'Remindere generate cu succes' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Dismisseaza (ascunde) un reminder - nu il sterge din DB
const dismiss = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ mesaj: 'Reminder-ul nu a fost gasit' });
    }

    if (reminder.utilizator.toString() !== req.user.id) {
      return res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }

    reminder.dismissed = true;
    await reminder.save();

    res.json({ mesaj: 'Notificare ascunsa - va reaparea cand rezolvi problema', reminder });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { getRemindere, genereaza, dismiss };