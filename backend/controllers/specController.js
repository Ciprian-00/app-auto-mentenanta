const VehicleSpec = require('../models/VehicleSpec');

// Cauta specificatii pentru un vehicul concret
const getSpec = async (req, res) => {
  try {
    const { marca, model, an, motor } = req.query;

    if (!marca || !model || !an) {
      return res.status(400).json({ mesaj: 'Marca, model si an sunt obligatorii' });
    }

    const query = {
      marca,
      model,
      anStart: { $lte: Number(an) },
      $or: [
        { anStop: { $gte: Number(an) } },
        { anStop: null }
      ]
    };

    if (motor) {
      query.motor = motor;
    }

    const spec = await VehicleSpec.findOne(query);

    if (!spec) {
      return res.status(404).json({
        mesaj: 'Nu am gasit specificatii pentru acest vehicul in baza de date'
      });
    }

    res.json(spec);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Lista toate specificatiile
const getAllSpecs = async (req, res) => {
  try {
    const { marca } = req.query;
    const filtru = marca ? { marca } : {};
    const specs = await VehicleSpec.find(filtru).sort({ marca: 1, model: 1, anStart: 1 });
    res.json(specs);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Returneaza modelele disponibile pentru o marca
const getModele = async (req, res) => {
  try {
    const { marca } = req.query;
    if (!marca) {
      return res.status(400).json({ mesaj: 'Marca este obligatorie' });
    }
    const modele = await VehicleSpec.distinct('model', { marca });
    res.json(modele.sort());
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Returneaza motorizarile disponibile pentru marca + model + an
const getMotorizari = async (req, res) => {
  try {
    const { marca, model, an } = req.query;
    if (!marca || !model || !an) {
      return res.status(400).json({ mesaj: 'Marca, model si an sunt obligatorii' });
    }

    const specs = await VehicleSpec.find({
      marca,
      model,
      anStart: { $lte: Number(an) },
      $or: [
        { anStop: { $gte: Number(an) } },
        { anStop: null }
      ]
    }).select('motor tipCombustibil');

    res.json(specs);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Adauga o specificatie noua
const adaugaSpec = async (req, res) => {
  try {
    const {
      marca, model, anStart, anStop, motor,
      ulei, anvelope, filtreSchimb,
      intervalDistributie, intervalLichidFrana
    } = req.body;

    const existent = await VehicleSpec.findOne({ marca, model, anStart, motor });
    if (existent) {
      return res.status(400).json({ mesaj: 'Specificatia exista deja in baza de date' });
    }

    const spec = await VehicleSpec.create({
      marca, model, anStart, anStop, motor,
      ulei, anvelope, filtreSchimb,
      intervalDistributie, intervalLichidFrana
    });

    res.status(201).json(spec);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Actualizeaza o specificatie
const actualizeazaSpec = async (req, res) => {
  try {
    const spec = await VehicleSpec.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!spec) {
      return res.status(404).json({ mesaj: 'Specificatia nu a fost gasita' });
    }

    res.json(spec);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Sterge o specificatie
const stergeSpec = async (req, res) => {
  try {
    const spec = await VehicleSpec.findByIdAndDelete(req.params.id);

    if (!spec) {
      return res.status(404).json({ mesaj: 'Specificatia nu a fost gasita' });
    }

    res.json({ mesaj: 'Specificatia a fost stearsa' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = {
  getSpec,
  getAllSpecs,
  getModele,
  getMotorizari,
  adaugaSpec,
  actualizeazaSpec,
  stergeSpec
};