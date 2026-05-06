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
  tip: {
    type: String,
    required: true,
    enum: ['Revizie', 'Schimb ulei', 'Anvelope', 'Frane', 'Distributie', 'Reparatie', 'ITP', 'Altele']
  },
  data: { type: Date, required: true },
  kilometraj: { type: Number, required: true },
  descriere: { type: String },
  cost: { type: Number },
  service: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);