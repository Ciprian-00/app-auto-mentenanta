const mongoose = require('mongoose');

const vehicleSpecSchema = new mongoose.Schema({
  marca: {
    type: String,
    required: true,
    enum: ['Volkswagen', 'Dacia', 'BMW', 'Audi', 'Renault', 'Mercedes-Benz', 'Skoda', 'Toyota', 'Ford']
  },
  model: { type: String, required: true },
  anStart: { type: Number, required: true },
  anStop: { type: Number },
  motor: { type: String, required: true },
  tipCombustibil: { type: String, required: true },
  // Ulei + filtre: la revizia de ulei (intervalKm / intervalLuni) se schimbă
  // uleiul și toate filtrele (ulei, aer, polen, combustibil) împreună.
  ulei: {
    tip: { type: String },
    cantitate: { type: Number },
    intervalKm: { type: Number },
    intervalLuni: { type: Number }
  },
  anvelope: {
    fata: { type: String },
    spate: { type: String }
  },
  presiuneAnvelope: { type: String },        // ex: "2.3 / 2.1 bar" (față / spate)
  capacitateRezervor: { type: Number },       // litri
  intervalDistributie: { type: Number },      // km; 0 = lanț de distribuție
  intervalDistributieLuni: { type: Number, default: 0 },
  intervalLichidFrana: { type: Number }       // luni
}, { timestamps: true });

module.exports = mongoose.model('VehicleSpec', vehicleSpecSchema);
