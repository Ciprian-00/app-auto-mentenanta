const Vehicle = require('../models/Vehicle');
const VehicleSpec = require('../models/VehicleSpec');
const Reminder = require('../models/Reminder');
const recomandariUlei = require('../logic/recomandariUlei');

// Adauga vehicul
const adaugaVehicul = async (req, res) => {
  try {
    const {
      marca, model, an, motor, vin,
      numarInmatriculare, kilometrajCurent,
      dataITP, dataRCA, dataRovinieta,
      ultimulSchimbUlei, documenteCustom
    } = req.body;

    const vehicul = await Vehicle.create({
      utilizator: req.user.id,
      marca, model, an, motor, vin,
      numarInmatriculare, kilometrajCurent,
      dataITP, dataRCA, dataRovinieta,
      ultimulSchimbUlei, documenteCustom
    });

    res.status(201).json(vehicul);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Atașează intervalul real de schimb al uleiului (din specificații) pe obiectul
// vehicul, ca lista și dashboard-ul să folosească aceeași valoare ca recomandările,
// nu un interval fix scris în frontend. Fallback: 15.000 km / 12 luni.
const ataseazaIntervalUlei = async (vehicul) => {
  const spec = await VehicleSpec.findOne({
    marca: vehicul.marca,
    model: vehicul.model,
    anStart: { $lte: vehicul.an },
    $or: [{ anStop: { $gte: vehicul.an } }, { anStop: null }]
  }).select('ulei.intervalKm ulei.intervalLuni');

  const v = vehicul.toObject();
  v.intervalUleiKm = spec?.ulei?.intervalKm || 15000;
  v.intervalUleiLuni = spec?.ulei?.intervalLuni || 12;
  return v;
};

// Toate vehiculele utilizatorului
const getVehicule = async (req, res) => {
  try {
    const vehicule = await Vehicle.find({ utilizator: req.user.id });
    const cuInterval = await Promise.all(vehicule.map(ataseazaIntervalUlei));
    res.json(cuInterval);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Un vehicul dupa ID
const getVehicul = async (req, res) => {
  try {
    const vehicul = await Vehicle.findById(req.params.id);

    if (!vehicul) {
      return res.status(404).json({ mesaj: 'Vehiculul nu a fost gasit' });
    }

    if (vehicul.utilizator.toString() !== req.user.id) {
      return res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }

    res.json(await ataseazaIntervalUlei(vehicul));
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Actualizeaza kilometraj
const actualizeazaKilometraj = async (req, res) => {
  try {
    const { kilometrajCurent } = req.body;

    const vehicul = await Vehicle.findById(req.params.id);

    if (!vehicul) {
      return res.status(404).json({ mesaj: 'Vehiculul nu a fost gasit' });
    }

    if (vehicul.utilizator.toString() !== req.user.id) {
      return res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }

    vehicul.kilometrajCurent = kilometrajCurent;
    await vehicul.save();

    res.json(vehicul);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Actualizeaza toate datele vehiculului
const actualizeazaVehicul = async (req, res) => {
  try {
    let vehicul = await Vehicle.findById(req.params.id);

    if (!vehicul) {
      return res.status(404).json({ mesaj: 'Vehiculul nu a fost gasit' });
    }

    if (vehicul.utilizator.toString() !== req.user.id) {
      return res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }

    vehicul = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    res.json(vehicul);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Sterge vehicul si toate reminderele asociate
const stergeVehicul = async (req, res) => {
  try {
    const vehicul = await Vehicle.findById(req.params.id);

    if (!vehicul) {
      return res.status(404).json({ mesaj: 'Vehiculul nu a fost gasit' });
    }

    if (vehicul.utilizator.toString() !== req.user.id) {
      return res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }

    // Sterge toate reminderele asociate acestui vehicul
    await Reminder.deleteMany({ vehicul: req.params.id });

    await vehicul.deleteOne();
    res.json({ mesaj: 'Vehiculul a fost sters' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Recomandari tehnice din baza de date proprie
const getRecomandari = async (req, res) => {
  try {
    const vehicul = await Vehicle.findById(req.params.id);

    if (!vehicul) {
      return res.status(404).json({ mesaj: 'Vehiculul nu a fost gasit' });
    }

    const spec = await VehicleSpec.findOne({
      marca: vehicul.marca,
      model: vehicul.model,
      anStart: { $lte: vehicul.an },
      $or: [
        { anStop: { $gte: vehicul.an } },
        { anStop: null }
      ]
    });

    if (!spec) {
      return res.status(404).json({ 
        mesaj: 'Nu am gasit specificatii pentru acest vehicul in baza de date' 
      });
    }

    const acum = new Date();
    const recomandari = recomandariUlei(vehicul, spec, acum);

    res.json({
      vehicul: {
        marca: vehicul.marca,
        model: vehicul.model,
        an: vehicul.an,
        motor: vehicul.motor
      },
      specificatii: spec,
      recomandari
    });

  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = {
  adaugaVehicul,
  getVehicule,
  getVehicul,
  actualizeazaVehicul,
  actualizeazaKilometraj,
  stergeVehicul,
  getRecomandari
};