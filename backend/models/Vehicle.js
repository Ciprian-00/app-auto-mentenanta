const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  utilizator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  marca: {
    type: String,
    required: true,
    enum: ['Volkswagen', 'Dacia', 'BMW', 'Audi', 'Renault', 'Mercedes-Benz', 'Skoda', 'Toyota', 'Ford']
  },
  model: { type: String, required: true },
  an: { type: Number, required: true },
  motor: { type: String, required: true },
  vin: { type: String, unique: true, sparse: true },
  numarInmatriculare: { type: String, trim: true },
  kilometrajCurent: { type: Number, default: 0 },
  dataITP: { type: Date },
  dataRCA: { type: Date },
  dataRovinieta: { type: Date },
  ultimulSchimbUlei: {
    data: { type: Date },
    kilometraj: { type: Number }
  },
  ultimaDistributie: {
    data: { type: Date },
    kilometraj: { type: Number }
  },
  ultimulLichidFrana: {
    data: { type: Date }
  },
  documenteCustom: [{
    nume: { type: String, required: true },
    dataExpirare: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);