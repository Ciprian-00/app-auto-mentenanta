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
  // Ulei (filtrul de ulei se schimbă mereu odată cu el): intervalKm / intervalLuni.
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
  intervalLichidFrana: { type: Number },      // luni
  // Filtre & bujii — fiecare cu interval propriu { km, luni }. Câmpurile pot lipsi:
  // filtru de combustibil doar la diesel (la benzină e în rezervor), bujii doar la
  // benzină/GPL/hibrid (dieselul are bujii incandescente, schimbate la nevoie).
  intervalFiltruAer: { km: { type: Number }, luni: { type: Number } },
  intervalFiltruPolen: { km: { type: Number }, luni: { type: Number } },
  intervalFiltruCombustibil: { km: { type: Number }, luni: { type: Number } },
  intervalBujii: { km: { type: Number }, luni: { type: Number } }
}, { timestamps: true });

module.exports = mongoose.model('VehicleSpec', vehicleSpecSchema);
