const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const Reminder = require('../models/Reminder');
const { genereazaRemindere } = require('../services/reminderService');

// Menține starea curentă a uleiului (vehicul.ultimulSchimbUlei) consistentă cu
// istoricul: o setează pe cel mai recent „Schimb ulei" din jurnal, sau o golește
// dacă nu mai există niciunul. Apelată după ce se adaugă/editează/șterge un astfel
// de log, ca secțiunea „Mentenanță" de sus să reflecte mereu istoricul real.
const sincronizeazaUlei = async (vehiculId, utilizatorId) => {
  const vehicul = await Vehicle.findOne({ _id: vehiculId, utilizator: utilizatorId });
  if (!vehicul) return;

  const ultim = await MaintenanceLog.findOne({
    vehicul: vehiculId, utilizator: utilizatorId, tip: 'Schimb ulei'
  }).sort({ data: -1 });

  if (ultim) {
    vehicul.ultimulSchimbUlei = { data: ultim.data, kilometraj: ultim.kilometraj || 0 };
    await vehicul.save();
    await genereazaRemindere(vehiculId, utilizatorId);
  } else {
    vehicul.ultimulSchimbUlei = { data: null, kilometraj: 0 };
    await vehicul.save();
    await Reminder.deleteOne({ vehicul: vehiculId, utilizator: utilizatorId, tip: 'Ulei' });
  }
};

const getIstoricVehicul = async (req, res) => {
  try {
    const intrari = await MaintenanceLog.find({
      vehicul: req.params.vehiculId,
      utilizator: req.user.id
    }).sort({ data: -1 });
    res.json(intrari);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

const adaugaIntrare = async (req, res) => {
  try {
    const { tip, categorie, data, kilometraj, descriere, cost, service } = req.body;
    const intrare = await MaintenanceLog.create({
      utilizator: req.user.id,
      vehicul: req.params.vehiculId,
      tip, categorie: categorie || 'service', data, kilometraj: kilometraj || 0, descriere, cost, service
    });
    if (tip === 'Schimb ulei') await sincronizeazaUlei(req.params.vehiculId, req.user.id);
    res.status(201).json(intrare);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

const actualizeazaIntrare = async (req, res) => {
  try {
    const intrare = await MaintenanceLog.findOne({ _id: req.params.id, utilizator: req.user.id });
    if (!intrare) return res.status(404).json({ mesaj: 'Intrare negăsită' });
    const tipVechi = intrare.tip;
    const { tip, data, kilometraj, descriere, cost, service } = req.body;
    Object.assign(intrare, { tip, data, kilometraj, descriere, cost, service });
    await intrare.save();
    if (tip === 'Schimb ulei' || tipVechi === 'Schimb ulei') {
      await sincronizeazaUlei(intrare.vehicul, req.user.id);
    }
    res.json(intrare);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

const stergeIntrare = async (req, res) => {
  try {
    const intrare = await MaintenanceLog.findOneAndDelete({ _id: req.params.id, utilizator: req.user.id });
    if (!intrare) return res.status(404).json({ mesaj: 'Intrare negăsită' });
    if (intrare.tip === 'Schimb ulei') await sincronizeazaUlei(intrare.vehicul, req.user.id);
    res.json({ mesaj: 'Șters' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { getIstoricVehicul, adaugaIntrare, actualizeazaIntrare, stergeIntrare };
