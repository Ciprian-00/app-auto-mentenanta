const Vehicle = require('../models/Vehicle');
const VehicleSpec = require('../models/VehicleSpec');
const Reminder = require('../models/Reminder');

// Adauga vehicul
const adaugaVehicul = async (req, res) => {
  try {
    const {
      marca, model, an, motor, vin,
      numarInmatriculare, kilometrajCurent,
      dataITP, dataRCA, dataRovinieta
    } = req.body;

    const vehicul = await Vehicle.create({
      utilizator: req.user.id,
      marca, model, an, motor, vin,
      numarInmatriculare, kilometrajCurent,
      dataITP, dataRCA, dataRovinieta
    });

    res.status(201).json(vehicul);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Toate vehiculele utilizatorului
const getVehicule = async (req, res) => {
  try {
    const vehicule = await Vehicle.find({ utilizator: req.user.id });
    res.json(vehicule);
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

    res.json(vehicul);
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
    const recomandari = [];

    if (vehicul.ultimulSchimbUlei && spec.ulei) {
      const kmDeLaSchimb = vehicul.kilometrajCurent - vehicul.ultimulSchimbUlei.kilometraj;
      const luniDeLaSchimb = Math.floor(
        (acum - new Date(vehicul.ultimulSchimbUlei.data)) / (1000 * 60 * 60 * 24 * 30)
      );

      if (kmDeLaSchimb >= spec.ulei.intervalKm * 0.9) {
        recomandari.push({
          tip: 'Schimb ulei',
          urgent: kmDeLaSchimb >= spec.ulei.intervalKm,
          mesaj: `Ai parcurs ${kmDeLaSchimb} km de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalKm} km.`,
          detalii: `Tip ulei recomandat: ${spec.ulei.tip}, Cantitate: ${spec.ulei.cantitate}L`
        });
      }

      if (luniDeLaSchimb >= spec.ulei.intervalLuni * 0.9) {
        recomandari.push({
          tip: 'Schimb ulei dupa timp',
          urgent: luniDeLaSchimb >= spec.ulei.intervalLuni,
          mesaj: `Au trecut ${luniDeLaSchimb} luni de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalLuni} luni.`,
          detalii: `Tip ulei recomandat: ${spec.ulei.tip}, Cantitate: ${spec.ulei.cantitate}L`
        });
      }
    }

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