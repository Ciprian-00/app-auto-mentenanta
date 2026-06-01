const MaintenanceLog = require('../models/MaintenanceLog');

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
    res.status(201).json(intrare);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

const actualizeazaIntrare = async (req, res) => {
  try {
    const intrare = await MaintenanceLog.findOne({ _id: req.params.id, utilizator: req.user.id });
    if (!intrare) return res.status(404).json({ mesaj: 'Intrare negăsită' });
    const { tip, data, kilometraj, descriere, cost, service } = req.body;
    Object.assign(intrare, { tip, data, kilometraj, descriere, cost, service });
    await intrare.save();
    res.json(intrare);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

const stergeIntrare = async (req, res) => {
  try {
    const intrare = await MaintenanceLog.findOneAndDelete({ _id: req.params.id, utilizator: req.user.id });
    if (!intrare) return res.status(404).json({ mesaj: 'Intrare negăsită' });
    res.json({ mesaj: 'Șters' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { getIstoricVehicul, adaugaIntrare, actualizeazaIntrare, stergeIntrare };
