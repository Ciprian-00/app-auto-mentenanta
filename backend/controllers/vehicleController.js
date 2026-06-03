const Vehicle = require('../models/Vehicle');
const VehicleSpec = require('../models/VehicleSpec');
const Reminder = require('../models/Reminder');

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

    if (spec.ulei) {
      const ulei = vehicul.ultimulSchimbUlei || {};
      const detaliiUlei = `Tip ulei recomandat: ${spec.ulei.tip}, Cantitate: ${spec.ulei.cantitate}L`;

      // Fără un punct de referință (data sau kilometrajul ultimului schimb) nu
      // putem ști de cât timp nu s-a schimbat uleiul — îl invităm să-l adauge,
      // în loc să presupunem (altfel ar ieși "de la 0 km / din 1970").
      if (!ulei.data && !(ulei.kilometraj > 0)) {
        recomandari.push({
          tip: 'Adaugă ultimul schimb de ulei',
          urgent: false,
          mesaj: 'Înregistrează data și kilometrajul ultimului schimb de ulei ca să primești recomandări corecte.',
          detalii: detaliiUlei
        });
      } else {
        // Recomandare după kilometraj — doar dacă știm kilometrajul de referință
        if (ulei.kilometraj > 0) {
          const kmDeLaSchimb = vehicul.kilometrajCurent - ulei.kilometraj;
          if (kmDeLaSchimb >= spec.ulei.intervalKm * 0.9) {
            recomandari.push({
              tip: 'Schimb ulei',
              urgent: kmDeLaSchimb >= spec.ulei.intervalKm,
              mesaj: `Ai parcurs ${kmDeLaSchimb} km de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalKm} km.`,
              detalii: detaliiUlei
            });
          }
        }

        // Recomandare după timp — doar dacă știm data ultimului schimb
        if (ulei.data) {
          const luniDeLaSchimb = Math.floor((acum - new Date(ulei.data)) / (1000 * 60 * 60 * 24 * 30));
          if (luniDeLaSchimb >= spec.ulei.intervalLuni * 0.9) {
            recomandari.push({
              tip: 'Schimb ulei dupa timp',
              urgent: luniDeLaSchimb >= spec.ulei.intervalLuni,
              mesaj: `Au trecut ${luniDeLaSchimb} luni de la ultimul schimb. Intervalul recomandat este ${spec.ulei.intervalLuni} luni.`,
              detalii: detaliiUlei
            });
          }
        }
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