const mongoose = require('mongoose');
const dotenv = require('dotenv');
const VehicleSpec = require('./models/VehicleSpec');

dotenv.config();

// Capacitate rezervor (litri) și presiune anvelope recomandată (față / spate),
// per model — valori orientative din specificațiile producătorului.
const REZERVOR = {
  'A3': 50, 'A4': 54, 'A6': 73,
  'Seria 3': 59, 'Seria 5': 68,
  'Logan': 50, 'Duster': 50, 'Sandero': 50,
  'Clasa C': 66, 'Clasa E': 66,
  'Clio': 42, 'Megane': 47,
  'Golf': 50, 'Passat': 66, 'Polo': 40, 'Tiguan': 58,
  'Octavia': 50, 'Fabia': 45, 'Superb': 66,
  'Yaris': 42, 'Corolla': 50,
  'Focus': 52, 'Fiesta': 42,
  'Jogger': 50, 'Lodgy': 50,
  'T-Roc': 50, 'Touran': 58, 'Caddy': 60,
  'Kamiq': 50, 'Karoq': 55, 'Kodiaq': 60,
  'RAV4': 55, 'C-HR': 43, 'Auris': 50,
  'Kuga': 54, 'Puma': 42, 'Mondeo': 62,
  'Captur': 48, 'Kadjar': 65,
  'Seria 1': 52, 'X1': 51, 'X3': 65,
  'A1': 45, 'Q3': 64, 'Q5': 70,
  'GLC': 66,
};

const PRESIUNE = {
  'A3': '2.3 / 2.1 bar', 'A4': '2.4 / 2.3 bar', 'A6': '2.4 / 2.3 bar',
  'Seria 3': '2.3 / 2.3 bar', 'Seria 5': '2.4 / 2.4 bar',
  'Logan': '2.2 / 2.1 bar', 'Duster': '2.3 / 2.3 bar', 'Sandero': '2.2 / 2.1 bar',
  'Clasa C': '2.4 / 2.4 bar', 'Clasa E': '2.4 / 2.4 bar',
  'Clio': '2.2 / 2.1 bar', 'Megane': '2.3 / 2.1 bar',
  'Golf': '2.3 / 2.1 bar', 'Passat': '2.4 / 2.3 bar', 'Polo': '2.2 / 2.1 bar', 'Tiguan': '2.3 / 2.3 bar',
  'Octavia': '2.3 / 2.1 bar', 'Fabia': '2.2 / 2.1 bar', 'Superb': '2.4 / 2.3 bar',
  'Yaris': '2.2 / 2.1 bar', 'Corolla': '2.3 / 2.2 bar',
  'Focus': '2.3 / 2.1 bar', 'Fiesta': '2.2 / 2.1 bar',
  'Jogger': '2.3 / 2.3 bar', 'Lodgy': '2.3 / 2.3 bar',
  'T-Roc': '2.3 / 2.3 bar', 'Touran': '2.4 / 2.4 bar', 'Caddy': '2.4 / 2.5 bar',
  'Kamiq': '2.3 / 2.3 bar', 'Karoq': '2.3 / 2.3 bar', 'Kodiaq': '2.4 / 2.4 bar',
  'RAV4': '2.4 / 2.4 bar', 'C-HR': '2.4 / 2.4 bar', 'Auris': '2.3 / 2.2 bar',
  'Kuga': '2.4 / 2.4 bar', 'Puma': '2.3 / 2.3 bar', 'Mondeo': '2.4 / 2.3 bar',
  'Captur': '2.3 / 2.3 bar', 'Kadjar': '2.3 / 2.3 bar',
  'Seria 1': '2.3 / 2.3 bar', 'X1': '2.4 / 2.4 bar', 'X3': '2.4 / 2.4 bar',
  'A1': '2.3 / 2.1 bar', 'Q3': '2.4 / 2.4 bar', 'Q5': '2.4 / 2.4 bar',
  'GLC': '2.4 / 2.4 bar',
};

// Distribuția se determină după familia de motor (mai sigur decât valori per intrare).
// Întoarce { km, luni }; km = 0 înseamnă lanț de distribuție (nu se schimbă periodic).
//
// Valorile de km sunt cele oficiale din manuale (ex. Planul de Service VW pentru
// Golf/Passat B6: verificare curea PD la 150.000 km, înlocuire 2.0 FSI/TFSI la
// 180.000 km, benzină 4 cil. verificare de la 90.000 km). Peste km, plafonul de
// vechime (luni) e factorul real de siguranță — cauciucul îmbătrânește chiar și cu
// rulaj mic (articol: o curea de 6-7 ani e un risc). Recomandarea iese pe „oricare
// intervine primul", așa că pentru un șofer obișnuit vârsta (6 ani) declanșează
// prima, ca în realitate; nicio curea nu trece de 6 ani.
const LANT = { km: 0, luni: 0 };
const CUREA_BENZINA_VECHE = { km: 90000, luni: 60 };    // MPI / 16V / Duratec / 1.8T atmosferice
const CUREA_BENZINA_MODERNA = { km: 150000, luni: 72 }; // TSI EA211 / EcoBoost (art.: noi până la 150k)
const CUREA_BENZINA_FSI = { km: 180000, luni: 72 };     // 2.0 FSI/TFSI EA113 (manual VW: înlocuire 180k)
const CUREA_DIESEL_VAG = { km: 150000, luni: 72 };      // TDI pompă-injector (manual VW: verificare 150k)
const CUREA_DIESEL = { km: 120000, luni: 72 };          // dCi / TDCi / EcoBlue (spec Renault/Ford)
const distributie = (marca, motor, an) => {
  const m = motor.toLowerCase();

  // BMW, Mercedes, Toyota: lanț de distribuție pe toată gama din baza noastră
  if (marca === 'BMW' || marca === 'Mercedes-Benz' || marca === 'Toyota') return LANT;

  // Renault / Dacia: benzină moderne (TCe/SCe/ECO-G/E-Tech/Hybrid) au lanț;
  // diesel (dCi) au curea, iar benzină atmosferice vechi (MPI/16V) tot curea
  if (marca === 'Renault' || marca === 'Dacia') {
    if (/tce|sce|eco-g|e-tech|hybrid/.test(m)) return LANT;
    if (/dci/.test(m)) return CUREA_DIESEL;
    if (/mpi|16v/.test(m)) return CUREA_BENZINA_VECHE;
    return LANT;
  }

  // Ford: curea de distribuție pe toată gama (umedă la EcoBoost/EcoBlue)
  if (marca === 'Ford') {
    if (/tdci|ecoblue/.test(m)) return CUREA_DIESEL;
    if (/ecoboost/.test(m)) return CUREA_BENZINA_MODERNA;
    return CUREA_BENZINA_VECHE;                                 // Duratec atmosferic
  }

  // Grup VAG (Volkswagen / Audi / Skoda)
  if (/tdi/.test(m)) return CUREA_DIESEL_VAG;                   // TDI pompă-injector: curea
  if (/tsi|tfsi/.test(m)) {
    const cc = parseFloat(m);                                   // 1.8/2.0 = EA888, 1.2 = EA111 → lanț
    if (cc === 1.8 || cc === 2.0 || cc === 1.2) return LANT;
    if (cc === 1.4) return an >= 2012 ? CUREA_BENZINA_MODERNA : LANT; // EA211 curea vs EA111 lanț
    return CUREA_BENZINA_MODERNA;                               // 1.0 / 1.5 / "35 TFSI" = EA211 curea
  }
  if (/fsi/.test(m)) return CUREA_BENZINA_FSI;                  // 2.0 FSI EA113: curea (manual VW: 180k)
  if (/htp/.test(m)) return LANT;                               // 1.2 HTP 3 cilindri: lanț
  return CUREA_BENZINA_VECHE;                                   // MPI / 1.8T atmosferice: curea
};

// ── Intervale filtre, bujii și ulei ───────────────────────────────────────
// Valori oficiale uzuale din planurile de service ale producătorilor (piață EU);
// confirmate punctual cu Planul de Service VW și auto-abc.eu. Unde producătorul nu
// publică o cifră exactă pentru un motor anume, se aplică norma pe marcă/familie.
// Toate respectă regula „oricare intervine primul" (km SAU luni).
const esteDiesel = (tip) => tip === 'Diesel';
const estePetrol = (tip) => tip === 'Benzina' || tip === 'GPL' || tip === 'Hibrid';

// Ulei: revizia standard EU e 15.000 km / 1 an (Planul de Service VW: „15.000 km sau
// 1 an"). Dieselul Dacia/Renault rămâne la 10.000 km (spec Renault, confirmat auto-abc).
const intervalUlei = (marca, tip) => {
  if ((marca === 'Dacia' || marca === 'Renault') && esteDiesel(tip)) return { km: 10000, luni: 12 };
  return { km: 15000, luni: 12 };
};

const filtruAer = (marca) => {
  if (marca === 'Dacia' || marca === 'Renault') return { km: 30000, luni: 36 };
  if (marca === 'Toyota') return { km: 40000, luni: 48 };
  return { km: 60000, luni: 48 };                              // VAG / BMW / Mercedes / Ford
};

const filtruPolen = (marca) => {
  if (marca === 'Dacia' || marca === 'Renault') return { km: 15000, luni: 12 };
  return { km: 30000, luni: 24 };
};

// Filtru de combustibil: serviciabil doar la diesel; la benzină e integrat în rezervor
// (fără schimb periodic) → null, ca să nu afișăm un interval inexistent.
const filtruCombustibil = (marca, tip) => {
  if (!esteDiesel(tip)) return null;
  if (marca === 'Dacia' || marca === 'Renault') return { km: 30000, luni: 36 };
  if (marca === 'Ford' || marca === 'Toyota') return { km: 40000, luni: 48 };
  return { km: 60000, luni: 48 };                              // VAG / BMW / Mercedes
};

// Bujii: doar la benzină/GPL/hibrid; dieselul are bujii incandescente (la nevoie) → null.
const bujii = (marca, motor, tip) => {
  if (!estePetrol(tip)) return null;
  const m = motor.toLowerCase();
  if (marca === 'Toyota') return { km: 90000, luni: 72 };      // VVT-i iridium long-life
  if ((marca === 'Dacia' || marca === 'Renault') && /mpi|16v/.test(m)) return { km: 30000, luni: 36 };
  return { km: 60000, luni: 48 };                              // turbo modern / VAG / BMW / MB / Ford
};

// Date de bază per motorizare (restul se completează prin reguli mai jos)
const baza = [

  // ===== AUDI =====
  // A3 8P (2003-2013)
  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.6 MPI 102', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.9 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Audi', model: 'A3', anStart: 2003, anStop: 2013, motor: '1.8 TFSI 160', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // A3 8V (2012-2020)
  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '1.6 TDI 110', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  { marca: 'Audi', model: 'A3', anStart: 2012, anStop: 2020, motor: '1.4 TFSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // A3 8Y (2020-prezent)
  { marca: 'Audi', model: 'A3', anStart: 2020, anStop: null, motor: '1.5 TFSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // A4 B8 (2008-2015)
  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '2.0 TDI 143', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '2.0 TDI 177', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  { marca: 'Audi', model: 'A4', anStart: 2008, anStop: 2015, motor: '1.8 TFSI 160', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.6 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  // A4 B9 (2015-prezent)
  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '2.0 TDI 190', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  { marca: 'Audi', model: 'A4', anStart: 2015, anStop: null, motor: '35 TFSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  // A6 C7 (2011-2018)
  { marca: 'Audi', model: 'A6', anStart: 2011, anStop: 2018, motor: '2.0 TDI 177', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.7 }, anvelope: { fata: '245/45 R18', spate: '245/45 R18' } },
  { marca: 'Audi', model: 'A6', anStart: 2011, anStop: 2018, motor: '3.0 TDI 245', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 7.0 }, anvelope: { fata: '255/40 R19', spate: '255/40 R19' } },

  // ===== BMW =====
  // Seria 3 E90 (2005-2011)
  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '318d 143', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '320d 163', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '205/55 R16', spate: '225/50 R16' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2005, anStop: 2011, motor: '330d 231', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.5 }, anvelope: { fata: '225/45 R17', spate: '255/40 R17' } },
  // Seria 3 F30 (2011-2019)
  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '316d 116', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '205/60 R16', spate: '205/60 R16' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '318d 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '205/55 R16', spate: '225/50 R16' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '320d 184', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2011, anStop: 2019, motor: '320i 184', tipCombustibil: 'Benzina', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  // Seria 3 G20 (2019-prezent)
  { marca: 'BMW', model: 'Seria 3', anStart: 2019, anStop: null, motor: '318d 150', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  { marca: 'BMW', model: 'Seria 3', anStart: 2019, anStop: null, motor: '320d 190', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  // Seria 5 F10 (2010-2017)
  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '520d 184', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.5 }, anvelope: { fata: '225/55 R17', spate: '245/50 R17' } },
  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '525d 218', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 7.0 }, anvelope: { fata: '245/45 R18', spate: '275/40 R18' } },
  { marca: 'BMW', model: 'Seria 5', anStart: 2010, anStop: 2017, motor: '520i 184', tipCombustibil: 'Benzina', ulei: { tip: '0W-30', cantitate: 5.5 }, anvelope: { fata: '225/55 R17', spate: '245/50 R17' } },
  // Seria 5 G30 (2017-prezent)
  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '520d 190', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '245/45 R18', spate: '275/40 R18' } },
  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '530d 265', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 6.5 }, anvelope: { fata: '245/45 R18', spate: '275/40 R18' } },
  { marca: 'BMW', model: 'Seria 5', anStart: 2017, anStop: null, motor: '520i 184', tipCombustibil: 'Benzina', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '245/45 R18', spate: '275/40 R18' } },

  // ===== DACIA =====
  // Logan (2004-2012)
  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.4 MPI 75', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 3.5 }, anvelope: { fata: '175/65 R14', spate: '175/65 R14' } },
  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.6 MPI 90', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 3.5 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Logan', anStart: 2004, anStop: 2012, motor: '1.5 dCi 85', tipCombustibil: 'Diesel', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  // Logan (2012-2020)
  { marca: 'Dacia', model: 'Logan', anStart: 2012, anStop: 2020, motor: '0.9 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.3 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Logan', anStart: 2012, anStop: 2020, motor: '1.5 dCi 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  // Logan (2020-prezent)
  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.5 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Logan', anStart: 2020, anStop: null, motor: '1.0 ECO-G 100', tipCombustibil: 'GPL', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  // Duster (2010-2017)
  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.6 16V 105', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 4.0 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.5 dCi 110', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.7 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  { marca: 'Dacia', model: 'Duster', anStart: 2010, anStop: 2017, motor: '1.2 TCe 125', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  // Duster (2018-prezent)
  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.3 TCe 130', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  { marca: 'Dacia', model: 'Duster', anStart: 2018, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.7 }, anvelope: { fata: '215/65 R16', spate: '215/65 R16' } },
  // Sandero (2012-2020)
  { marca: 'Dacia', model: 'Sandero', anStart: 2012, anStop: 2020, motor: '0.9 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.3 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Sandero', anStart: 2012, anStop: 2020, motor: '1.5 dCi 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  // Sandero (2020-prezent)
  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.5 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Sandero', anStart: 2020, anStop: null, motor: '1.0 ECO-G 100', tipCombustibil: 'GPL', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },

  // ===== MERCEDES-BENZ =====
  // Clasa C W203 (2000-2007)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C180 129', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 6.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C200 CDI 116', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2000, anStop: 2007, motor: 'C220 CDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.5 }, anvelope: { fata: '205/55 R16', spate: '225/50 R16' } },
  // Clasa C W204 (2007-2014)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C200 CDI 136', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.5 }, anvelope: { fata: '225/45 R17', spate: '245/45 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C220 CDI 170', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.5 }, anvelope: { fata: '225/45 R17', spate: '245/45 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2007, anStop: 2014, motor: 'C180 Kompressor 156', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 6.0 }, anvelope: { fata: '225/45 R17', spate: '245/45 R17' } },
  // Clasa C W205 (2014-2021)
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2014, anStop: 2021, motor: 'C200d 160', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 6.5 }, anvelope: { fata: '225/50 R17', spate: '245/45 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2014, anStop: 2021, motor: 'C220d 194', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 6.5 }, anvelope: { fata: '225/50 R17', spate: '245/45 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa C', anStart: 2018, anStop: null, motor: 'C200 184', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 6.5 }, anvelope: { fata: '225/50 R17', spate: '245/45 R17' } },
  // Clasa E W212 (2009-2016)
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E200 CDI 136', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 7.0 }, anvelope: { fata: '245/45 R17', spate: '245/45 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E220 CDI 170', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 7.0 }, anvelope: { fata: '245/45 R17', spate: '265/40 R17' } },
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2009, anStop: 2016, motor: 'E350 CDI 265', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 8.5 }, anvelope: { fata: '245/40 R18', spate: '275/35 R18' } },
  // Clasa E W213 (2016-prezent)
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E200d 160', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 7.0 }, anvelope: { fata: '245/45 R18', spate: '245/45 R18' } },
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E220d 194', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 7.0 }, anvelope: { fata: '245/45 R18', spate: '245/45 R18' } },
  { marca: 'Mercedes-Benz', model: 'Clasa E', anStart: 2016, anStop: null, motor: 'E300d 245', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 8.5 }, anvelope: { fata: '245/40 R19', spate: '275/35 R19' } },

  // ===== RENAULT =====
  // Clio 4 (2012-2019)
  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '0.9 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.3 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '1.2 MPI 75', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 3.5 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  { marca: 'Renault', model: 'Clio', anStart: 2012, anStop: 2019, motor: '1.5 dCi 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.75 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  // Clio 5 (2019-prezent)
  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.0 SCe 65', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.5 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },
  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.0 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.75 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },
  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.75 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },
  { marca: 'Renault', model: 'Clio', anStart: 2019, anStop: null, motor: '1.6 E-Tech 140', tipCombustibil: 'Hibrid', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },
  // Megane 3 (2008-2016)
  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.5 dCi 110', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.6 dCi 130', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '225/50 R16' } },
  { marca: 'Renault', model: 'Megane', anStart: 2008, anStop: 2016, motor: '1.4 TCe 130', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Megane 4 (2016-prezent)
  { marca: 'Renault', model: 'Megane', anStart: 2016, anStop: null, motor: '1.5 Blue dCi 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Renault', model: 'Megane', anStart: 2016, anStop: null, motor: '1.3 TCe 140', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },

  // ===== VOLKSWAGEN =====
  // Golf 5 (2003-2008)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.4 MPI 80', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.6 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.6 MPI 102', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '1.9 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2003, anStop: 2008, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Golf 6 (2008-2012)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.2 TSI 105', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.6 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.4 TSI 122', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '1.6 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2008, anStop: 2012, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Golf 7 (2012-2020)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.0 TSI 110', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.4 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2012, anStop: 2020, motor: '1.6 TDI 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2013, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // Golf 8 (2020-prezent)
  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '1.0 TSI 110', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Golf', anStart: 2020, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 4.3 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // Passat B5/B5.5 (1996-2005)
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.8 T 150', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.9 TDI 101', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '1.9 TDI 130', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '2.5 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 6.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 1996, anStop: 2005, motor: '2.0 TDI 136', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Passat B6 (2005-2010)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '1.9 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2005, anStop: 2010, motor: '2.0 FSI 150', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  // Passat B7 (2010-2014)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '1.6 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/55 R17', spate: '225/55 R17' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2010, anStop: 2014, motor: '1.4 TSI 122', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Passat B8 (2014-prezent)
  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '1.6 TDI 120', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/55 R17', spate: '225/55 R17' } },
  { marca: 'Volkswagen', model: 'Passat', anStart: 2014, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '225/55 R17', spate: '225/55 R17' } },
  // Polo (2017-prezent)
  { marca: 'Volkswagen', model: 'Polo', anStart: 2017, anStop: null, motor: '1.0 MPI 65', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.0 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Volkswagen', model: 'Polo', anStart: 2017, anStop: null, motor: '1.0 TSI 95', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  // Tiguan (2007-2016)
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2007, anStop: 2016, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '235/55 R17', spate: '235/55 R17' } },
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2007, anStop: 2016, motor: '1.4 TSI 122', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '235/55 R17', spate: '235/55 R17' } },
  // Tiguan (2016-prezent)
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2016, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '235/50 R18', spate: '235/50 R18' } },
  { marca: 'Volkswagen', model: 'Tiguan', anStart: 2016, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '235/50 R18', spate: '235/50 R18' } },

  // ===== SKODA =====
  // Octavia Mk1 (1996-2004)
  { marca: 'Skoda', model: 'Octavia', anStart: 1996, anStop: 2004, motor: '1.6 MPI 101', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 4.0 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 1996, anStop: 2004, motor: '1.9 TDI 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  // Octavia Mk2 (2004-2013)
  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.6 MPI 102', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.9 TDI 105', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2004, anStop: 2013, motor: '1.4 TSI 122', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Octavia Mk3 (2013-2020)
  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '1.0 TSI 115', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '1.6 TDI 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2013, anStop: 2020, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // Octavia Mk4 (2020-prezent)
  { marca: 'Skoda', model: 'Octavia', anStart: 2020, anStop: null, motor: '1.0 TSI 110', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Skoda', model: 'Octavia', anStart: 2020, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 4.3 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // Fabia (2000-2014)
  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.2 HTP 65', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.2 }, anvelope: { fata: '175/65 R14', spate: '175/65 R14' } },
  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.4 MPI 75', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.6 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Skoda', model: 'Fabia', anStart: 2000, anStop: 2014, motor: '1.4 TDI 80', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.6 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  // Fabia (2014-prezent)
  { marca: 'Skoda', model: 'Fabia', anStart: 2014, anStop: null, motor: '1.0 MPI 60', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.0 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Skoda', model: 'Fabia', anStart: 2014, anStop: null, motor: '1.0 TSI 95', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  // Superb Mk2 (2008-2015)
  { marca: 'Skoda', model: 'Superb', anStart: 2008, anStop: 2015, motor: '1.8 TSI 160', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.6 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  { marca: 'Skoda', model: 'Superb', anStart: 2008, anStop: 2015, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/55 R16', spate: '225/55 R16' } },
  // Superb Mk3 (2015-prezent)
  { marca: 'Skoda', model: 'Superb', anStart: 2015, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },
  { marca: 'Skoda', model: 'Superb', anStart: 2015, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '225/50 R17', spate: '225/50 R17' } },

  // ===== TOYOTA =====
  // Yaris Mk2 (2005-2011)
  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.0 VVT-i 69', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.4 }, anvelope: { fata: '175/65 R14', spate: '175/65 R14' } },
  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.3 VVT-i 87', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.7 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Toyota', model: 'Yaris', anStart: 2005, anStop: 2011, motor: '1.4 D-4D 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.2 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  // Yaris Mk3 (2011-2020)
  { marca: 'Toyota', model: 'Yaris', anStart: 2011, anStop: 2020, motor: '1.0 VVT-i 69', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.4 }, anvelope: { fata: '175/65 R15', spate: '175/65 R15' } },
  { marca: 'Toyota', model: 'Yaris', anStart: 2011, anStop: 2020, motor: '1.33 VVT-i 99', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 4.2 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  // Yaris Mk4 (2020-prezent)
  { marca: 'Toyota', model: 'Yaris', anStart: 2020, anStop: null, motor: '1.0 VVT-i 72', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.4 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Toyota', model: 'Yaris', anStart: 2020, anStop: null, motor: '1.5 Hybrid 116', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.2 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },
  // Corolla E150 (2006-2013)
  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '1.4 VVT-i 97', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.7 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '1.6 VVT-i 124', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.9 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Toyota', model: 'Corolla', anStart: 2006, anStop: 2013, motor: '2.0 D-4D 91', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  // Corolla E170 (2013-2018)
  { marca: 'Toyota', model: 'Corolla', anStart: 2013, anStop: 2018, motor: '1.6 VVT-i 132', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.9 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Toyota', model: 'Corolla', anStart: 2013, anStop: 2018, motor: '1.4 D-4D 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.2 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  // Corolla E210 (2019-prezent)
  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '1.2 Turbo 116', tipCombustibil: 'Benzina', ulei: { tip: '0W-16', cantitate: 4.2 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '1.8 Hybrid 122', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.2 }, anvelope: { fata: '215/45 R17', spate: '215/45 R17' } },
  { marca: 'Toyota', model: 'Corolla', anStart: 2019, anStop: null, motor: '2.0 Hybrid 184', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '225/40 R18', spate: '225/40 R18' } },

  // ===== FORD =====
  // Focus Mk2 (2004-2011)
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.4 Duratec 80', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 4.0 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.6 Duratec 100', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.6 TDCi 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '1.8 TDCi 115', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Ford', model: 'Focus', anStart: 2004, anStop: 2011, motor: '2.0 TDCi 136', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Focus Mk3 (2011-2018)
  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 3.8 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '1.5 TDCi 120', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Ford', model: 'Focus', anStart: 2011, anStop: 2018, motor: '2.0 TDCi 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.0 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  // Focus Mk4 (2018-prezent)
  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 3.8 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.5 EcoBoost 150', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 4.5 }, anvelope: { fata: '225/45 R17', spate: '225/45 R17' } },
  { marca: 'Ford', model: 'Focus', anStart: 2018, anStop: null, motor: '1.5 EcoBlue 120', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Fiesta Mk6 (2008-2017)
  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.25 Duratec 82', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.3 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.4 Duratec 96', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.6 }, anvelope: { fata: '195/50 R15', spate: '195/50 R15' } },
  { marca: 'Ford', model: 'Fiesta', anStart: 2008, anStop: 2017, motor: '1.6 TDCi 95', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.0 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  // Fiesta Mk7 (2017-prezent)
  { marca: 'Ford', model: 'Fiesta', anStart: 2017, anStop: null, motor: '1.0 EcoBoost 95', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 3.8 }, anvelope: { fata: '195/55 R15', spate: '195/55 R15' } },
  { marca: 'Ford', model: 'Fiesta', anStart: 2017, anStop: null, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 3.8 }, anvelope: { fata: '195/55 R16', spate: '195/55 R16' } },

  // ===== MODELE SUPLIMENTARE =====
  // Dacia Jogger (2022-prezent)
  { marca: 'Dacia', model: 'Jogger', anStart: 2022, anStop: null, motor: '1.0 TCe 110', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 3.8 }, anvelope: { fata: '205/60 R16', spate: '205/60 R16' } },
  { marca: 'Dacia', model: 'Jogger', anStart: 2022, anStop: null, motor: '1.0 ECO-G 100', tipCombustibil: 'GPL', ulei: { tip: '5W-30', cantitate: 3.8 }, anvelope: { fata: '205/60 R16', spate: '205/60 R16' } },
  { marca: 'Dacia', model: 'Jogger', anStart: 2023, anStop: null, motor: '1.6 Hybrid 140', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.5 }, anvelope: { fata: '205/60 R16', spate: '205/60 R16' } },
  // Dacia Lodgy (2012-2022)
  { marca: 'Dacia', model: 'Lodgy', anStart: 2012, anStop: 2022, motor: '1.6 MPI 85', tipCombustibil: 'Benzina', ulei: { tip: '10W-40', cantitate: 4.8 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },
  { marca: 'Dacia', model: 'Lodgy', anStart: 2012, anStop: 2022, motor: '1.5 dCi 110', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '185/65 R15', spate: '185/65 R15' } },

  // Volkswagen T-Roc (2017-prezent)
  { marca: 'Volkswagen', model: 'T-Roc', anStart: 2017, anStop: null, motor: '1.0 TSI 115', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '215/60 R17', spate: '215/60 R17' } },
  { marca: 'Volkswagen', model: 'T-Roc', anStart: 2017, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '215/55 R17', spate: '215/55 R17' } },
  { marca: 'Volkswagen', model: 'T-Roc', anStart: 2017, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '215/55 R17', spate: '215/55 R17' } },
  // Volkswagen Touran (2015-prezent)
  { marca: 'Volkswagen', model: 'Touran', anStart: 2015, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Touran', anStart: 2015, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // Volkswagen Caddy (2015-2020)
  { marca: 'Volkswagen', model: 'Caddy', anStart: 2015, anStop: 2020, motor: '1.4 TSI 125', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.0 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Volkswagen', model: 'Caddy', anStart: 2015, anStop: 2020, motor: '2.0 TDI 102', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },

  // Skoda Kamiq (2019-prezent)
  { marca: 'Skoda', model: 'Kamiq', anStart: 2019, anStop: null, motor: '1.0 TSI 110', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 3.6 }, anvelope: { fata: '205/60 R16', spate: '205/60 R16' } },
  { marca: 'Skoda', model: 'Kamiq', anStart: 2019, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '205/55 R17', spate: '205/55 R17' } },
  // Skoda Karoq (2017-prezent)
  { marca: 'Skoda', model: 'Karoq', anStart: 2017, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '215/55 R17', spate: '215/55 R17' } },
  { marca: 'Skoda', model: 'Karoq', anStart: 2017, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '215/55 R17', spate: '215/55 R17' } },
  // Skoda Kodiaq (2016-prezent)
  { marca: 'Skoda', model: 'Kodiaq', anStart: 2016, anStop: null, motor: '1.5 TSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '235/55 R18', spate: '235/55 R18' } },
  { marca: 'Skoda', model: 'Kodiaq', anStart: 2016, anStop: null, motor: '2.0 TDI 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '235/55 R18', spate: '235/55 R18' } },

  // Toyota RAV4 (2019-prezent)
  { marca: 'Toyota', model: 'RAV4', anStart: 2019, anStop: null, motor: '2.5 Hybrid 218', tipCombustibil: 'Hibrid', ulei: { tip: '0W-16', cantitate: 4.8 }, anvelope: { fata: '225/60 R18', spate: '225/60 R18' } },
  // Toyota C-HR (2016-prezent)
  { marca: 'Toyota', model: 'C-HR', anStart: 2016, anStop: null, motor: '1.2 Turbo 116', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.2 }, anvelope: { fata: '215/60 R17', spate: '215/60 R17' } },
  { marca: 'Toyota', model: 'C-HR', anStart: 2016, anStop: null, motor: '1.8 Hybrid 122', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.2 }, anvelope: { fata: '225/50 R18', spate: '225/50 R18' } },
  // Toyota Auris (2012-2018)
  { marca: 'Toyota', model: 'Auris', anStart: 2012, anStop: 2018, motor: '1.33 VVT-i 99', tipCombustibil: 'Benzina', ulei: { tip: '5W-30', cantitate: 4.2 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Toyota', model: 'Auris', anStart: 2012, anStop: 2018, motor: '1.4 D-4D 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.2 }, anvelope: { fata: '195/65 R15', spate: '195/65 R15' } },
  { marca: 'Toyota', model: 'Auris', anStart: 2012, anStop: 2018, motor: '1.8 Hybrid 136', tipCombustibil: 'Hibrid', ulei: { tip: '0W-20', cantitate: 4.2 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },

  // Ford Kuga (2019-prezent)
  { marca: 'Ford', model: 'Kuga', anStart: 2019, anStop: null, motor: '1.5 EcoBoost 150', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 4.1 }, anvelope: { fata: '225/60 R17', spate: '225/60 R17' } },
  { marca: 'Ford', model: 'Kuga', anStart: 2019, anStop: null, motor: '1.5 EcoBlue 120', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.5 }, anvelope: { fata: '225/60 R17', spate: '225/60 R17' } },
  // Ford Puma (2019-prezent)
  { marca: 'Ford', model: 'Puma', anStart: 2019, anStop: null, motor: '1.0 EcoBoost 125', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 4.1 }, anvelope: { fata: '215/55 R17', spate: '215/55 R17' } },
  // Ford Mondeo (2014-2022)
  { marca: 'Ford', model: 'Mondeo', anStart: 2014, anStop: 2022, motor: '1.5 EcoBoost 160', tipCombustibil: 'Benzina', ulei: { tip: '5W-20', cantitate: 4.1 }, anvelope: { fata: '215/55 R16', spate: '215/55 R16' } },
  { marca: 'Ford', model: 'Mondeo', anStart: 2014, anStop: 2022, motor: '2.0 TDCi 150', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.6 }, anvelope: { fata: '215/55 R16', spate: '215/55 R16' } },

  // Renault Captur (2013-prezent)
  { marca: 'Renault', model: 'Captur', anStart: 2013, anStop: null, motor: '0.9 TCe 90', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.3 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Renault', model: 'Captur', anStart: 2013, anStop: null, motor: '1.5 dCi 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 3.75 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'Renault', model: 'Captur', anStart: 2019, anStop: null, motor: '1.3 TCe 130', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '215/60 R17', spate: '215/60 R17' } },
  // Renault Kadjar (2015-prezent)
  { marca: 'Renault', model: 'Kadjar', anStart: 2015, anStop: null, motor: '1.3 TCe 140', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 4.5 }, anvelope: { fata: '215/60 R17', spate: '215/60 R17' } },
  { marca: 'Renault', model: 'Kadjar', anStart: 2015, anStop: null, motor: '1.5 dCi 110', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '215/60 R17', spate: '215/60 R17' } },

  // BMW Seria 1 (F20, 2011-2019)
  { marca: 'BMW', model: 'Seria 1', anStart: 2011, anStop: 2019, motor: '116d 116', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  { marca: 'BMW', model: 'Seria 1', anStart: 2011, anStop: 2019, motor: '118i 136', tipCombustibil: 'Benzina', ulei: { tip: '0W-30', cantitate: 4.25 }, anvelope: { fata: '205/55 R16', spate: '205/55 R16' } },
  // BMW X1 (F48, 2015-prezent)
  { marca: 'BMW', model: 'X1', anStart: 2015, anStop: null, motor: '18d 150', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 5.0 }, anvelope: { fata: '225/55 R17', spate: '225/55 R17' } },
  { marca: 'BMW', model: 'X1', anStart: 2015, anStop: null, motor: '20i 192', tipCombustibil: 'Benzina', ulei: { tip: '0W-30', cantitate: 4.5 }, anvelope: { fata: '225/55 R17', spate: '225/55 R17' } },
  // BMW X3 (G01, 2017-prezent)
  { marca: 'BMW', model: 'X3', anStart: 2017, anStop: null, motor: '20d 190', tipCombustibil: 'Diesel', ulei: { tip: '0W-30', cantitate: 5.25 }, anvelope: { fata: '245/50 R19', spate: '245/50 R19' } },

  // Audi A1 (8X, 2010-2018)
  { marca: 'Audi', model: 'A1', anStart: 2010, anStop: 2018, motor: '1.6 TDI 90', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.3 }, anvelope: { fata: '185/60 R15', spate: '185/60 R15' } },
  { marca: 'Audi', model: 'A1', anStart: 2010, anStop: 2018, motor: '1.4 TFSI 122', tipCombustibil: 'Benzina', ulei: { tip: '5W-40', cantitate: 3.6 }, anvelope: { fata: '215/45 R16', spate: '215/45 R16' } },
  // Audi Q3 (8U, 2011-2018)
  { marca: 'Audi', model: 'Q3', anStart: 2011, anStop: 2018, motor: '2.0 TDI 140', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 4.5 }, anvelope: { fata: '235/55 R17', spate: '235/55 R17' } },
  { marca: 'Audi', model: 'Q3', anStart: 2015, anStop: 2018, motor: '1.4 TFSI 150', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 4.6 }, anvelope: { fata: '235/50 R18', spate: '235/50 R18' } },
  // Audi Q5 (FY, 2017-prezent)
  { marca: 'Audi', model: 'Q5', anStart: 2017, anStop: null, motor: '2.0 TDI 190', tipCombustibil: 'Diesel', ulei: { tip: '5W-30', cantitate: 5.7 }, anvelope: { fata: '235/60 R18', spate: '235/60 R18' } },
  { marca: 'Audi', model: 'Q5', anStart: 2017, anStop: null, motor: '2.0 TFSI 252', tipCombustibil: 'Benzina', ulei: { tip: '0W-20', cantitate: 6.4 }, anvelope: { fata: '235/60 R18', spate: '235/60 R18' } },

  // Mercedes-Benz GLC (X253, 2015-prezent)
  { marca: 'Mercedes-Benz', model: 'GLC', anStart: 2015, anStop: null, motor: 'GLC 220d 194', tipCombustibil: 'Diesel', ulei: { tip: '0W-20', cantitate: 6.5 }, anvelope: { fata: '235/60 R18', spate: '235/60 R18' } },

];

// Completează fiecare intrare cu valorile derivate prin reguli: ulei (15.000 km / 1 an,
// 10.000 la dieselul Dacia/Renault), distribuție după familia de motor, lichid de frână
// la 24 luni, filtre (aer/polen/combustibil) și bujii per marcă/familie, plus rezervor
// și presiune anvelope per model.
const specs = baza.map((s) => {
  const d = distributie(s.marca, s.motor, s.anStart);
  const ulei = intervalUlei(s.marca, s.tipCombustibil);
  return {
    ...s,
    ulei: { ...s.ulei, intervalKm: ulei.km, intervalLuni: ulei.luni },
    presiuneAnvelope: PRESIUNE[s.model] || '2.3 / 2.1 bar',
    capacitateRezervor: REZERVOR[s.model] || null,
    intervalDistributie: d.km,
    intervalDistributieLuni: d.luni,
    intervalLichidFrana: 24,
    intervalFiltruAer: filtruAer(s.marca),
    intervalFiltruPolen: filtruPolen(s.marca),
    intervalFiltruCombustibil: filtruCombustibil(s.marca, s.tipCombustibil), // null la benzină
    intervalBujii: bujii(s.marca, s.motor, s.tipCombustibil),                // null la diesel
  };
});

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
