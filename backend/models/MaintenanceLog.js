const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
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
  tip: { type: String, required: true },
  categorie: { type: String, enum: ['service', 'document'], default: 'service' },
  data: { type: Date, required: true },
  kilometraj: { type: Number, default: 0 },
  descriere: { type: String },
  cost: { type: Number },
  service: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);