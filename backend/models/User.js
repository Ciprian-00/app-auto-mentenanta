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
    zileInainteAlerta: { type: Number, default: 30 },
    notificariActive: { type: Boolean, default: false }
  },
  // Abonamente Web Push (cate unul per dispozitiv/browser)
  pushSubscriptions: [{
    _id: false,
    endpoint: String,
    keys: { p256dh: String, auth: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);