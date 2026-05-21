const Reminder = require('../models/Reminder');
const Vehicle = require('../models/Vehicle');
const VehicleSpec = require('../models/VehicleSpec');

const zileRamase = (dataExpirare) => {
  const acum = new Date();
  const expirare = new Date(dataExpirare);
  return Math.ceil((expirare - acum) / (1000 * 60 * 60 * 24));
};

const FIXE = ['ITP', 'RCA', 'Rovinieta', 'Ulei', 'Distributie', 'LichidFrana'];

const genereazaRemindere = async (vehiculId, utilizatorId) => {
  const vehicul = await Vehicle.findById(vehiculId);
  if (!vehicul) return;

  // Cauta specificatiile tehnice pentru acest vehicul
  const spec = await VehicleSpec.findOne({
    marca: vehicul.marca,
    model: vehicul.model,
    anStart: { $lte: vehicul.an },
    $or: [{ anStop: null }, { anStop: { $gte: vehicul.an } }]
  });

  const remindereDeCreat = [];

  if (vehicul.dataITP) {
    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'ITP',
      dataExpirare: vehicul.dataITP, zileInainte: 30,
      mesaj: `ITP-ul pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataITP).toLocaleDateString('ro-RO')}`
    });
  }

  if (vehicul.dataRCA) {
    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'RCA',
      dataExpirare: vehicul.dataRCA, zileInainte: 30,
      mesaj: `RCA-ul pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataRCA).toLocaleDateString('ro-RO')}`
    });
  }

  if (vehicul.dataRovinieta) {
    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'Rovinieta',
      dataExpirare: vehicul.dataRovinieta, zileInainte: 7,
      mesaj: `Rovinieta pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataRovinieta).toLocaleDateString('ro-RO')}`
    });
  }

  if (vehicul.ultimulSchimbUlei?.data) {
    const dataSchimb = new Date(vehicul.ultimulSchimbUlei.data);
    const intervalUleiLuni = spec?.ulei?.intervalLuni || 12;
    const intervalUleiKm = spec?.ulei?.intervalKm || 10000;

    const dataUrmatoare = new Date(dataSchimb);
    dataUrmatoare.setMonth(dataUrmatoare.getMonth() + intervalUleiLuni);

    const kmLaSchimb = vehicul.ultimulSchimbUlei.kilometraj || 0;
    const kmCurent = vehicul.kilometrajCurent || 0;
    const depasitKm = kmCurent > 0 && kmLaSchimb > 0 && (kmCurent - kmLaSchimb) >= intervalUleiKm;
    const dataFinala = depasitKm ? new Date(Date.now() - 1000) : dataUrmatoare;

    const mesajUlei = depasitKm
      ? `Schimb ulei depășit la kilometraj — ${(kmCurent - kmLaSchimb).toLocaleString('ro-RO')} km de la ultimul schimb pentru ${vehicul.marca} ${vehicul.model}`
      : `Schimb ulei recomandat pe ${dataUrmatoare.toLocaleDateString('ro-RO')} pentru ${vehicul.marca} ${vehicul.model}`;

    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'Ulei',
      dataExpirare: dataFinala, zileInainte: 30, mesaj: mesajUlei
    });
  }

  // Distribuție — interval km + interval timp
  if (spec?.intervalDistributie > 0 && vehicul.ultimaDistributie?.data) {
    const intervalKm = spec.intervalDistributie;
    const intervalLuni = spec.intervalDistributieLuni || 60;

    const dataUltima = new Date(vehicul.ultimaDistributie.data);
    const dataUrmatoare = new Date(dataUltima);
    dataUrmatoare.setMonth(dataUrmatoare.getMonth() + intervalLuni);

    const kmUltima = vehicul.ultimaDistributie.kilometraj || 0;
    const kmCurent = vehicul.kilometrajCurent || 0;
    const depasitKm = kmUltima > 0 && kmCurent > 0 && (kmCurent - kmUltima) >= intervalKm;
    const dataFinala = depasitKm ? new Date(Date.now() - 1000) : dataUrmatoare;

    const mesaj = depasitKm
      ? `Distribuție depășită la kilometraj — ${(kmCurent - kmUltima).toLocaleString('ro-RO')} km de la ultima schimbare pentru ${vehicul.marca} ${vehicul.model}`
      : `Schimb distribuție recomandat pe ${dataUrmatoare.toLocaleDateString('ro-RO')} pentru ${vehicul.marca} ${vehicul.model}`;

    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'Distributie',
      dataExpirare: dataFinala, zileInainte: 60, mesaj
    });
  }

  // Lichid frână — interval timp
  if (spec?.intervalLichidFrana > 0 && vehicul.ultimulLichidFrana?.data) {
    const intervalLuni = spec.intervalLichidFrana;
    const dataUltima = new Date(vehicul.ultimulLichidFrana.data);
    const dataUrmatoare = new Date(dataUltima);
    dataUrmatoare.setMonth(dataUrmatoare.getMonth() + intervalLuni);

    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId, tip: 'LichidFrana',
      dataExpirare: dataUrmatoare, zileInainte: 60,
      mesaj: `Schimb lichid de frână recomandat pe ${dataUrmatoare.toLocaleDateString('ro-RO')} pentru ${vehicul.marca} ${vehicul.model}`
    });
  }

  // Documente custom — sterge cele vechi, recreeaza din lista curenta
  await Reminder.deleteMany({
    vehicul: vehiculId,
    utilizator: utilizatorId,
    tip: { $nin: FIXE }
  });

  for (const doc of vehicul.documenteCustom || []) {
    if (!doc.dataExpirare) continue;
    remindereDeCreat.push({
      utilizator: utilizatorId, vehicul: vehiculId,
      tip: doc.nume, dataExpirare: doc.dataExpirare, zileInainte: 30,
      mesaj: `${doc.nume} pentru ${vehicul.marca} ${vehicul.model} expiră pe ${new Date(doc.dataExpirare).toLocaleDateString('ro-RO')}`
    });
  }

  // Remindere fixe — upsert
  for (const reminder of remindereDeCreat.filter(r => FIXE.includes(r.tip))) {
    const existent = await Reminder.findOne({ vehicul: vehiculId, tip: reminder.tip, utilizator: utilizatorId });
    if (!existent) {
      await Reminder.create(reminder);
    } else {
      existent.dataExpirare = reminder.dataExpirare;
      existent.mesaj = reminder.mesaj;
      existent.dismissed = false;
      await existent.save();
    }
  }

  // Documente custom — create direct
  for (const reminder of remindereDeCreat.filter(r => !FIXE.includes(r.tip))) {
    await Reminder.create(reminder);
  }
};

const getRemindereActive = async (utilizatorId) => {
  const remindere = await Reminder.find({
    utilizator: utilizatorId,
    dismissed: false
  }).populate('vehicul', 'marca model numarInmatriculare _id').lean();

  return remindere.map(r => {
    const zile = zileRamase(r.dataExpirare);
    return {
      ...r,
      zileRamase: zile,
      status: zile <= 0 ? 'expirat' : zile <= r.zileInainte ? 'urgent' : 'ok'
    };
  });
};

module.exports = { genereazaRemindere, getRemindereActive, zileRamase };
