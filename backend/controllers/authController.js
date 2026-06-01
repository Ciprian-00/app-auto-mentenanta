const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Reminder = require('../models/Reminder');
const MaintenanceLog = require('../models/MaintenanceLog');
const { genereazaRemindere } = require('../services/reminderService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inregistrare
const register = async (req, res) => {
  try {
    const { nume, email, parola, telefon } = req.body;

    const userExistent = await User.findOne({ email });
    if (userExistent) {
      return res.status(400).json({ mesaj: 'Email-ul este deja folosit' });
    }

    const salt = await bcrypt.genSalt(10);
    const parolaHash = await bcrypt.hash(parola, salt);

    const user = await User.create({
      nume,
      email,
      parola: parolaHash,
      telefon
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: user._id,
      nume: user.nume,
      email: user.email,
      token
    });

  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Autentificare
const login = async (req, res) => {
  try {
    const { email, parola } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ mesaj: 'Email sau parola incorecte' });
    }

    const parolaCorecta = await bcrypt.compare(parola, user.parola);
    if (!parolaCorecta) {
      return res.status(400).json({ mesaj: 'Email sau parola incorecte' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      nume: user.nume,
      email: user.email,
      token
    });

  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Profil utilizator
const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-parola');
    res.json(user);
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Actualizare date cont (nume, email, telefon)
const actualizeazaProfil = async (req, res) => {
  try {
    const { nume, email, telefon } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ mesaj: 'Utilizator negăsit' });

    // Verifică dacă noul email e folosit de alt cont
    if (email && email.toLowerCase() !== user.email) {
      const existent = await User.findOne({ email: email.toLowerCase() });
      if (existent) return res.status(400).json({ mesaj: 'Email-ul este deja folosit' });
      user.email = email;
    }
    if (nume) user.nume = nume;
    if (telefon !== undefined) user.telefon = telefon;

    await user.save();
    res.json({ _id: user._id, nume: user.nume, email: user.email, telefon: user.telefon });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Schimbare parolă (verifică parola curentă)
const schimbaParola = async (req, res) => {
  try {
    const { parolaCurenta, parolaNoua } = req.body;
    if (!parolaCurenta || !parolaNoua) {
      return res.status(400).json({ mesaj: 'Completează ambele parole' });
    }
    if (parolaNoua.length < 6) {
      return res.status(400).json({ mesaj: 'Parola nouă trebuie să aibă minim 6 caractere' });
    }

    const user = await User.findById(req.user.id);
    const corecta = await bcrypt.compare(parolaCurenta, user.parola);
    if (!corecta) return res.status(400).json({ mesaj: 'Parola curentă este greșită' });

    const salt = await bcrypt.genSalt(10);
    user.parola = await bcrypt.hash(parolaNoua, salt);
    await user.save();

    res.json({ mesaj: 'Parola a fost schimbată' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Actualizare setări (pragul de alerte) + regenerare remindere cu noul prag
const actualizeazaSetari = async (req, res) => {
  try {
    const { zileInainteAlerta } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ mesaj: 'Utilizator negăsit' });

    if (zileInainteAlerta !== undefined) {
      const zile = Number(zileInainteAlerta);
      if (zile < 1 || zile > 90) return res.status(400).json({ mesaj: 'Pragul trebuie să fie între 1 și 90 de zile' });
      user.setari = { ...user.setari, zileInainteAlerta: zile };
    }
    await user.save();

    // Regenerează reminderele tuturor mașinilor ca să aplice noul prag
    const vehicule = await Vehicle.find({ utilizator: req.user.id }).select('_id');
    await Promise.all(vehicule.map(v => genereazaRemindere(v._id, req.user.id)));

    res.json({ setari: user.setari });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

// Ștergere cont + toate datele asociate (mașini, remindere, intervenții)
const stergeContul = async (req, res) => {
  try {
    await MaintenanceLog.deleteMany({ utilizator: req.user.id });
    await Reminder.deleteMany({ utilizator: req.user.id });
    await Vehicle.deleteMany({ utilizator: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ mesaj: 'Contul a fost șters' });
  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { register, login, getProfil, actualizeazaProfil, schimbaParola, actualizeazaSetari, stergeContul };