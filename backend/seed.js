const mongoose = require('mongoose');
const dotenv = require('dotenv');
const VehicleSpec = require('./models/VehicleSpec');

dotenv.config();

const specs = [

  // ===== AUDI =====

  // A3 - 8P (2003-2013)
  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.6 MPI 102', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.9 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.8 TFSI 160', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // A3 - 8V (2012-2020)
  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '1.6 TDI 110', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '1.4 TFSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A3', anStart: 2020, anStop: null, motor: '1.5 TFSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // A4 - B8 (2008-2015)
  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '2.0 TDI 143', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '2.0 TDI 177', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '1.8 TFSI 160', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // A4 - B9 (2015-prezent)
  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '2.0 TDI 190', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '35 TFSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // A6 - C7 (2011-2018)
  { marca: 'Audi', model: 'A6', anStart: 2011, anStop: 2018, motor: '2.0 TDI 177', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.7, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '245/45 R18' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Audi', model: 'A6', anStart: 2011, anStop: 2018, motor: '3.0 TDI 245', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '255/40 R19', spate: '255/40 R19' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== BMW =====

  // Seria 3 - E90 (2005-2011)
  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '318d 143', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '320d 163', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '225/50 R16' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '330d 231', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '255/40 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Seria 3 - F30 (2011-2019)
  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '316d 116', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/60 R16', spate: '205/60 R16' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '318d 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '225/50 R16' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '320d 184', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '320i 184', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Seria 3 - G20 (2019-prezent)
  { marca: 'BMW', model: 'Seria 3', anStart: 2019, anStop: null, motor: '318d 150', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 3', anStart: 2019, anStop: null, motor: '320d 190', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Seria 5 - F10 (2010-2017)
  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '520d 184', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R17', spate: '245/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '525d 218', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '275/40 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '520i 184', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-30', cantitate: 5.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R17', spate: '245/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Seria 5 - G30 (2017-prezent)
  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '520d 190', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '275/40 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '530d 265', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-30', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '275/40 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '520i 184', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '275/40 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== DACIA =====

  // Logan (2004-2012)
  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.4 MPI 75', tipCombustibil: 'Benzina',
    ulei: { tip: '10W-40', cantitate: 3.5, intervalKm: 7500, intervalLuni: 12 },
    anvelope: { fata: '175/65 R14', spate: '175/65 R14' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.6 MPI 90', tipCombustibil: 'Benzina',
    ulei: { tip: '10W-40', cantitate: 3.5, intervalKm: 7500, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.5 dCi 85', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Logan (2012-2020)
  { marca: 'Dacia', model: 'Logan', anStart: 2012, anStop: 2020, motor: '0.9 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Logan', anStart: 2012, anStop: 2020, motor: '1.5 dCi 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Logan (2020-prezent)
  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 ECO-G 100', tipCombustibil: 'GPL',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  // Duster (2010-2017)
  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.6 16V 105', tipCombustibil: 'Benzina',
    ulei: { tip: '10W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.5 dCi 110', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.7, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.2 TCe 125', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Duster (2018-prezent)
  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.3 TCe 130', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.7, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '215/65 R16', spate: '215/65 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Sandero (2012-2020)
  { marca: 'Dacia', model: 'Sandero', anStart: 2012, anStop: 2020, motor: '0.9 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Sandero', anStart: 2012, anStop: 2020, motor: '1.5 dCi 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Sandero (2020-prezent)
  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 ECO-G 100', tipCombustibil: 'GPL',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  // ===== MERCEDES-BENZ =====

  // Clasa C - W203 (2000-2007)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C180 129', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 6.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C200 CDI 116', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C220 CDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '225/50 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Clasa C - W204 (2007-2014)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C200 CDI 136', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C220 CDI 170', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C180 Kompressor 156', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 6.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Clasa C - W205 (2014-2021)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2014, anStop: 2021, motor: 'C200d 160', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2014, anStop: 2021, motor: 'C220d 194', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2018, anStop: null, motor: 'C200 184', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 6.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Clasa E - W212 (2009-2016)
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E200 CDI 136', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R17', spate: '245/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E220 CDI 170', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R17', spate: '265/40 R17' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E350 CDI 265', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 8.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/40 R18', spate: '275/35 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 1791', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Clasa E - W213 (2016-prezent)
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E200d 160', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '245/45 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E220d 194', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 7.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/45 R18', spate: '245/45 R18' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E300d 245', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 8.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '245/40 R19', spate: '275/35 R19' },
    filtreSchimb: { filtruUlei: 'OC 1569', filtruAer: 'LX 3733', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== RENAULT =====

  // Clio 4 (2012-2019)
  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '0.9 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '1.2 MPI 75', tipCombustibil: 'Benzina',
    ulei: { tip: '10W-40', cantitate: 3.5, intervalKm: 7500, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '1.5 dCi 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Clio 5 (2019-prezent)
  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 3.75, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.6 E-Tech 140', tipCombustibil: 'Hibrid',
    ulei: { tip: '5W-40', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Megane 3 (2008-2016)
  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.5 dCi 110', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.6 dCi 130', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '225/50 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.4 TCe 130', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  // Megane 4 (2016-prezent)
  { marca: 'Renault', model: 'Megane', anStart: 2016, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 120000, intervalLichidFrana: 24 },

  { marca: 'Renault', model: 'Megane', anStart: 2016, anStop: null, motor: '1.3 TCe 140', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 150000, intervalLichidFrana: 24 },

  // ===== VOLKSWAGEN =====

  // Golf 5 (2003-2008)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.4 MPI 80', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.6 MPI 102', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.9 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Golf 6 (2008-2012)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.2 TSI 105', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.4 TSI 122', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.6 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Golf 7 (2012-2020)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.0 TSI 110', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.4 TSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.6 TDI 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2013, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Golf 8 (2020-prezent)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '1.0 TSI 110', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Passat B5 / B5.5 (1996-2005)
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.8 T 150', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.9 TDI 101', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.9 TDI 130', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '2.5 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 6.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '2.0 TDI 136', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Passat B6 (2005-2010)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '1.9 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '2.0 FSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Passat B7 (2010-2014)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '1.6 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R17', spate: '225/55 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '1.4 TSI 122', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Passat B8 (2014-prezent)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '1.6 TDI 120', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R17', spate: '225/55 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R17', spate: '225/55 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Polo (2017-prezent)
  { marca: 'Volkswagen', model: 'Polo', anStart: 2017, anStop: null, motor: '1.0 MPI 65', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Polo', anStart: 2017, anStop: null, motor: '1.0 TSI 95', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Tiguan (2007-2016)
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2007, anStop: 2016, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '235/55 R17', spate: '235/55 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2007, anStop: 2016, motor: '1.4 TSI 122', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '235/55 R17', spate: '235/55 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Tiguan (2016-prezent)
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2016, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '235/50 R18', spate: '235/50 R18' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2016, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '235/50 R18', spate: '235/50 R18' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== SKODA =====

  // Octavia Mk1 (1996-2004)
  { marca: 'Skoda', model: 'Octavia', anStart: 1996, anStop: 2004, motor: '1.6 MPI 101', tipCombustibil: 'Benzina',
    ulei: { tip: '10W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 1996, anStop: 2004, motor: '1.9 TDI 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  // Octavia Mk2 (2004-2013)
  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.6 MPI 102', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.9 TDI 105', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 90000, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.4 TSI 122', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Octavia Mk3 (2013-2020)
  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '1.0 TSI 115', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '1.6 TDI 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Octavia Mk4 (2020-prezent)
  { marca: 'Skoda', model: 'Octavia', anStart: 2020, anStop: null, motor: '1.0 TSI 110', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Octavia', anStart: 2020, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '0W-20', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Fabia (2000-2014)
  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.2 HTP 65', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.2, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '175/65 R14', spate: '175/65 R14' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.4 MPI 75', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 60000, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.4 TDI 80', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 3.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Fabia (2014-prezent)
  { marca: 'Skoda', model: 'Fabia', anStart: 2014, anStop: null, motor: '1.0 MPI 60', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 3.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Fabia', anStart: 2014, anStop: null, motor: '1.0 TSI 95', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 3.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Superb Mk2 (2008-2015)
  { marca: 'Skoda', model: 'Superb', anStart: 2008, anStop: 2015, motor: '1.8 TSI 160', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-40', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Superb', anStart: 2008, anStop: 2015, motor: '2.0 TDI 140', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/55 R16', spate: '225/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Superb Mk3 (2015-prezent)
  { marca: 'Skoda', model: 'Superb', anStart: 2015, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Skoda', model: 'Superb', anStart: 2015, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/50 R17', spate: '225/50 R17' },
    filtreSchimb: { filtruUlei: 'OC 575', filtruAer: 'LX 2059', filtryCombustibil: 'KL 775' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== TOYOTA =====

  // Yaris Mk2 (2005-2011)
  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.0 VVT-i 69', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.4, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '175/65 R14', spate: '175/65 R14' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.3 VVT-i 87', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.7, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.4 D-4D 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.2, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Yaris Mk3 (2011-2020)
  { marca: 'Toyota', model: 'Yaris', anStart: 2011, anStop: 2020, motor: '1.0 VVT-i 69', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.4, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '175/65 R15', spate: '175/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Yaris', anStart: 2011, anStop: 2020, motor: '1.33 VVT-i 99', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 4.2, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Yaris Mk4 (2020-prezent)
  { marca: 'Toyota', model: 'Yaris', anStart: 2020, anStop: null, motor: '1.0 VVT-i 72', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.4, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '185/65 R15', spate: '185/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Yaris', anStart: 2020, anStop: null, motor: '1.5 Hybrid 116', tipCombustibil: 'Hibrid',
    ulei: { tip: '0W-20', cantitate: 4.2, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Corolla E150 (2006-2013)
  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '1.4 VVT-i 97', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.7, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '1.6 VVT-i 124', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.9, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '2.0 D-4D 91', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Corolla E170 (2013-2018)
  { marca: 'Toyota', model: 'Corolla', anStart: 2013, anStop: 2018, motor: '1.6 VVT-i 132', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.9, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Corolla', anStart: 2013, anStop: 2018, motor: '1.4 D-4D 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.2, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Corolla E210 (2019-prezent)
  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '1.2 Turbo 116', tipCombustibil: 'Benzina',
    ulei: { tip: '0W-16', cantitate: 4.2, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '1.8 Hybrid 122', tipCombustibil: 'Hibrid',
    ulei: { tip: '0W-20', cantitate: 4.2, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '215/45 R17', spate: '215/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '2.0 Hybrid 184', tipCombustibil: 'Hibrid',
    ulei: { tip: '0W-20', cantitate: 4.6, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/40 R18', spate: '225/40 R18' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // ===== FORD =====

  // Focus Mk2 (2004-2011)
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.4 Duratec 80', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.6 Duratec 100', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.6 TDCi 90', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/65 R15', spate: '195/65 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.8 TDCi 115', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.5, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '2.0 TDCi 136', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Focus Mk3 (2011-2018)
  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-20', cantitate: 3.8, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '1.5 TDCi 120', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '2.0 TDCi 150', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 5.0, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 986', filtruAer: 'LX 5062', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Focus Mk4 (2018-prezent)
  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-20', cantitate: 3.8, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.5 EcoBoost 150', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-20', cantitate: 4.5, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '225/45 R17', spate: '225/45 R17' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.5 EcoBlue 120', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.3, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '205/55 R16', spate: '205/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Fiesta Mk6 (2008-2017)
  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.25 Duratec 82', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.3, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.4 Duratec 96', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-30', cantitate: 3.6, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '195/50 R15', spate: '195/50 R15' },
    filtreSchimb: { filtruUlei: 'OC 295', filtruAer: 'LX 914', filtryCombustibil: 'KL 149' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.6 TDCi 95', tipCombustibil: 'Diesel',
    ulei: { tip: '5W-30', cantitate: 4.0, intervalKm: 10000, intervalLuni: 12 },
    anvelope: { fata: '185/60 R15', spate: '185/60 R15' },
    filtreSchimb: { filtruUlei: 'OC 469', filtruAer: 'LX 3204', filtryCombustibil: 'KL 440' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  // Fiesta Mk7 (2017-prezent)
  { marca: 'Ford', model: 'Fiesta', anStart: 2017, anStop: null, motor: '1.0 EcoBoost 95', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-20', cantitate: 3.8, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R15', spate: '195/55 R15' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

  { marca: 'Ford', model: 'Fiesta', anStart: 2017, anStop: null, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina',
    ulei: { tip: '5W-20', cantitate: 3.8, intervalKm: 15000, intervalLuni: 12 },
    anvelope: { fata: '195/55 R16', spate: '195/55 R16' },
    filtreSchimb: { filtruUlei: 'OC 1073', filtruAer: 'LX 3734', filtryCombustibil: 'KL 928' },
    intervalDistributie: 0, intervalLichidFrana: 24 },

];

const importDate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectat');

    await VehicleSpec.deleteMany({});
    console.log('Date vechi sterse');

    await VehicleSpec.insertMany(specs);
    console.log(`${specs.length} specificatii importate cu succes`);

    process.exit(0);
  } catch (error) {
    console.error('Eroare:', error.message);
    process.exit(1);
  }
};

importDate();