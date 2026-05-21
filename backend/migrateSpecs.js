const mongoose = require('mongoose');
const dotenv = require('dotenv');
const VehicleSpec = require('./models/VehicleSpec');

dotenv.config();

const getLuniBelt = (km) => {
  if (!km || km === 0) return 0;
  if (km <= 60000) return 48;
  if (km <= 90000) return 60;
  if (km <= 120000) return 60;
  return 72;
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Conectat la MongoDB');
  const specs = await VehicleSpec.find({ intervalDistributieLuni: { $exists: false } });
  console.log(`Actualizez ${specs.length} specificații...`);
  for (const spec of specs) {
    spec.intervalDistributieLuni = getLuniBelt(spec.intervalDistributie);
    await spec.save();
  }
  console.log('Migrare completă.');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
