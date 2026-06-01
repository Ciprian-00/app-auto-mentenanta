const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nume: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  parola: {
    type: String,
    required: true
  },
  telefon: {
    type: String,
    trim: true
  },
  setari: {
    zileInainteAlerta: { type: Number, default: 30 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);