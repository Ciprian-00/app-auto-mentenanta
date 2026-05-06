const User = require('../models/User');
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

module.exports = { register, login, getProfil };