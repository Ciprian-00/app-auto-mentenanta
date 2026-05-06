const Reminder = require('../models/Reminder');
const Vehicle = require('../models/Vehicle');

const zileRamase = (dataExpirare) => {
  const acum = new Date();
  const expirare = new Date(dataExpirare);
  const diferenta = expirare - acum;
  return Math.ceil(diferenta / (1000 * 60 * 60 * 24));
};

const genereazaRemindere = async (vehiculId, utilizatorId) => {
  const vehicul = await Vehicle.findById(vehiculId);
  if (!vehicul) return;

  const remindereDeCreat = [];

  if (vehicul.dataITP) {
    remindereDeCreat.push({
      utilizator: utilizatorId,
      vehicul: vehiculId,
      tip: 'ITP',
      dataExpirare: vehicul.dataITP,
      zileInainte: 30,
      mesaj: `ITP-ul pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataITP).toLocaleDateString('ro-RO')}`
    });
  }

  if (vehicul.dataRCA) {
    remindereDeCreat.push({
      utilizator: utilizatorId,
      vehicul: vehiculId,
      tip: 'RCA',
      dataExpirare: vehicul.dataRCA,
      zileInainte: 30,
      mesaj: `RCA-ul pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataRCA).toLocaleDateString('ro-RO')}`
    });
  }

  if (vehicul.dataRovinieta) {
    remindereDeCreat.push({
      utilizator: utilizatorId,
      vehicul: vehiculId,
      tip: 'Rovinieta',
      dataExpirare: vehicul.dataRovinieta,
      zileInainte: 7,
      mesaj: `Rovinieta pentru ${vehicul.marca} ${vehicul.model} expira pe ${new Date(vehicul.dataRovinieta).toLocaleDateString('ro-RO')}`
    });
  }

  // Documente custom — sterge cele vechi, recreeaza din lista curenta
  await Reminder.deleteMany({
    vehicul: vehiculId,
    utilizator: utilizatorId,
    tip: { $nin: ['ITP', 'RCA', 'Rovinieta'] }
  });

  for (const doc of vehicul.documenteCustom || []) {
    if (!doc.dataExpirare) continue;
    remindereDeCreat.push({
      utilizator: utilizatorId,
      vehicul: vehiculId,
      tip: doc.nume,
      dataExpirare: doc.dataExpirare,
      zileInainte: 30,
      mesaj: `${doc.nume} pentru ${vehicul.marca} ${vehicul.model} expiră pe ${new Date(doc.dataExpirare).toLocaleDateString('ro-RO')}`
    });
  }

  // Documente fixe (ITP/RCA/Rovinieta) — upsert
  const FIXE = ['ITP', 'RCA', 'Rovinieta'];
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

  // Documente custom — create direct (au fost sterse mai sus)
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
      status: zile <= 0 ? 'expirat' :
              zile <= r.zileInainte ? 'urgent' : 'ok'
    };
  });
};

module.exports = { genereazaRemindere, getRemindereActive, zileRamase };