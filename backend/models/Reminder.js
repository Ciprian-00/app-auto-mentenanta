const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  utilizator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicul: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  tip: {
    type: String,
    required: true
  },
  dataExpirare: { type: Date, required: true },
  zileInainte: { type: Number, default: 30 },
  dismissed: { type: Boolean, default: false },
  mesaj: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);