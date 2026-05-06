const Tesseract = require('tesseract.js');
const Jimp = require('jimp');

// Coduri județe valide România
const CODURI_JUDETE = new Set([
  'AB','AG','AR','B','BC','BH','BN','BR','BT','BV','BZ',
  'CJ','CL','CS','CT','CV','DB','DJ','GJ','GL','GR','HD',
  'HR','IF','IL','IS','MH','MM','MS','NT','OT','PH','SB',
  'SJ','SM','SV','TL','TM','TR','VL','VN','VS'
]);

// Prefixe WMI (primele 3 caractere VIN) per producător
const WMI_MARCA = {
  'WVW': 'Volkswagen', 'WV1': 'Volkswagen', 'WV2': 'Volkswagen',
  'WAU': 'Audi', 'WA1': 'Audi',
  'WBA': 'BMW', 'WBS': 'BMW', 'WBY': 'BMW',
  'VF1': 'Renault', 'VF3': 'Renault', 'VF6': 'Renault',
  'UU1': 'Dacia',
  'WDB': 'Mercedes-Benz', 'WDC': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz',
  'W1N': 'Mercedes-Benz',
  'TMB': 'Skoda', 'TMA': 'Skoda',
  'JTD': 'Toyota', 'JTE': 'Toyota', 'JTM': 'Toyota', 'JTN': 'Toyota',
  'SB1': 'Toyota', 'SB3': 'Toyota',
  'WF0': 'Ford', 'WFO': 'Ford', 'WF3': 'Ford',
  'SFO': 'Ford', 'SAF': 'Ford',
};

// Modele cunoscute per marcă — pentru detecție în text brut
const MODELE_MARCA = {
  'Volkswagen': ['Passat', 'Golf', 'Polo', 'Tiguan', 'Jetta', 'Touareg', 'Caddy', 'Sharan', 'Touran', 'T-Roc', 'Arteon'],
  'Dacia': ['Logan', 'Sandero', 'Duster', 'Lodgy', 'Dokker', 'Spring', 'Jogger'],
  'BMW': ['Seria 3', 'Seria 5', 'Seria 1', 'Seria 7', 'Seria 4', 'Seria 2', 'X3', 'X5', 'X1'],
  'Audi': ['A3', 'A4', 'A6', 'A1', 'A5', 'A7', 'A8', 'Q3', 'Q5', 'Q7'],
  'Renault': ['Clio', 'Megane', 'Laguna', 'Scenic', 'Kadjar', 'Koleos', 'Captur', 'Duster', 'Kangoo', 'Trafic'],
  'Mercedes-Benz': ['Clasa C', 'Clasa E', 'Clasa A', 'Clasa B', 'Clasa S', 'GLC', 'GLE', 'GLA', 'GLB', 'Vito'],
  'Skoda': ['Octavia', 'Fabia', 'Superb', 'Karoq', 'Kodiaq', 'Scala', 'Kamiq'],
  'Toyota': ['Yaris', 'Corolla', 'Auris', 'Avensis', 'RAV4', 'Land Cruiser', 'C-HR', 'Prius'],
  'Ford': ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'EcoSport', 'Puma', 'Galaxy', 'S-Max'],
};

// Preprocesează imaginea: grayscale + contrast + scale up pentru OCR mai bun
const preprocesareImagine = async (buffer) => {
  try {
    const img = await Jimp.read(buffer);

    // Scale up dacă imaginea e mică (sub 1500px lățime)
    if (img.getWidth() < 1500) {
      img.scale(2);
    }

    img
      .greyscale()       // alb-negru — elimină zgomotul de culoare
      .normalize()       // auto-contrast: întinde histograma la min/max
      .contrast(0.2);    // contrast ușor crescut

    return await img.getBufferAsync(Jimp.MIME_PNG);
  } catch (err) {
    console.warn('Preprocesare imagine eșuată, folosesc originalul:', err.message);
    return buffer;
  }
};

// Acceptă Buffer (memory storage)
const extrageText = async (buffer) => {
  const procesat = await preprocesareImagine(buffer);
  const { data: { text } } = await Tesseract.recognize(procesat, 'ron+eng', {
    logger: m => console.log(m)
  });
  return text;
};

const parseazaDateVehicul = (text) => {
  const date = {
    marca: null, model: null, an: null, vin: null,
    numarInmatriculare: null, combustibil: null,
    cilindree: null, putereKw: null, culoare: null,
    nrLocuri: null, dataITP: null, dataRCA: null,
  };

  // ── VIN — 17 caractere, validat prin prefix WMI ───────────────────────────
  const toateWMI = new Set(Object.keys(WMI_MARCA));

  const vinCandidati = [];
  // Colectează toate blocurile de 17+ caractere alfanumerice din text
  const textCompact = text.replace(/\s/g, '').toUpperCase();
  const allBlocks = textCompact.match(/[A-Z0-9]{17,}/g) || [];
  for (const bloc of allBlocks) {
    // Extrage toate subșirurile de 17 caractere din bloc
    for (let i = 0; i <= bloc.length - 17; i++) {
      vinCandidati.push(bloc.substring(i, i + 17));
    }
  }

  // Alege primul candidat cu WMI valid (prefix de 3 litere cunoscut)
  for (const candidat of vinCandidati) {
    if (!/^[A-HJ-NPR-Z]/.test(candidat)) continue;
    const wmi = candidat.substring(0, 3);
    if (toateWMI.has(wmi)) {
      date.vin = candidat;
      if (!date.marca && WMI_MARCA[wmi]) date.marca = WMI_MARCA[wmi];
      break;
    }
  }

  // ── Număr de înmatriculare — validat față de coduri județe ────────────────
  // Separatorul dintre componente: spații, liniuță (-), cratimă lungă (–—)
  // OCR redă adesea "SV-67-CPY" sau "SV —67-CPY"

  // Strategie 1: lângă eticheta A
  const aLabelMatch = text.match(/(?:^|\n)\s*A\b[^A-Z\n]{0,8}([A-Z]{1,2})[\s\-–—]*(\d{2,3})[\s\-–—]*([A-Z]{2,3})/im);
  if (aLabelMatch && CODURI_JUDETE.has(aLabelMatch[1].toUpperCase())) {
    date.numarInmatriculare = `${aLabelMatch[1].toUpperCase()} ${aLabelMatch[2]} ${aLabelMatch[3].toUpperCase()}`;
  }
  // Strategie 2: oriunde în text cu validare județ (cu sau fără liniuțe)
  if (!date.numarInmatriculare) {
    const numarRegex = /([A-Z]{1,2})[\s\-–—]*(\d{2,3})[\s\-–—]*([A-Z]{2,3})/g;
    let m;
    while ((m = numarRegex.exec(text)) !== null) {
      if (CODURI_JUDETE.has(m[1].toUpperCase()) && m[3].length === 3) {
        date.numarInmatriculare = `${m[1].toUpperCase()} ${m[2]} ${m[3].toUpperCase()}`;
        break;
      }
    }
  }

  // ── Marcă ─────────────────────────────────────────────────────────────────
  if (!date.marca) {
    // Câmpul D.1 (cu variante de OCR: D1, D .1, D,1)
    const d1 = extrageCamp(text, 'D[\\s.,]?1');
    if (d1) date.marca = normalizeazaMarca(d1);
  }
  if (!date.marca) date.marca = detecteazaMarca(text);

  // ── Model ─────────────────────────────────────────────────────────────────
  // Strategie 1: câmpul D.3 (denumire comercială)
  const d3 = extrageCamp(text, 'D[\\s.,]?3');
  if (d3 && !esteKodTehnic(d3)) {
    date.model = normalizeazaModel(d3);
  }
  // Strategie 2: câmpul D.2
  if (!date.model) {
    const d2 = extrageCamp(text, 'D[\\s.,]?2');
    if (d2 && !esteKodTehnic(d2)) date.model = normalizeazaModel(d2);
  }
  // Strategie 3: caută modele cunoscute în text (cel mai robust fallback)
  if (!date.model && date.marca) {
    const modele = MODELE_MARCA[date.marca] || [];
    const textUp = text.toUpperCase();
    for (const model of modele) {
      if (textUp.includes(model.toUpperCase())) {
        date.model = model;
        break;
      }
    }
  }

  // ── An fabricație ─────────────────────────────────────────────────────────
  // Strategie 1: câmpul B (data primei înmatriculări) — linia care începe cu B
  const bMatch = text.match(/(?:^|[\n\r])\s*B\b[^0-9\n\r]{0,8}(\d{2})[./\s-](\d{2})[./\s-](\d{4})/im);
  if (bMatch) {
    date.an = parseInt(bMatch[3]);
  }
  // Strategie 2: primul an rezonabil (nu din viitor) în text
  if (!date.an) {
    const anMatch = text.match(/\b(19[6-9]\d|200\d|201\d|202[0-5])\b/);
    if (anMatch) date.an = parseInt(anMatch[1]);
  }

  // ── Combustibil ───────────────────────────────────────────────────────────
  const p3 = extrageCamp(text, 'P[\\s.,]?3');
  if (p3) date.combustibil = normalizeazaCombustibil(p3);
  if (!date.combustibil) date.combustibil = detecteazaCombustibil(text);

  // ── Cilindree (600–7000 cm³) ───────────────────────────────────────────────
  const p1 = extrageCamp(text, 'P[\\s.,]?1');
  if (p1) {
    const m = p1.match(/(\d{3,5})/);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 600 && val <= 7000) date.cilindree = val;
    }
  }

  // ── Putere kW (30–1500) ───────────────────────────────────────────────────
  const p2 = extrageCamp(text, 'P[\\s.,]?2');
  if (p2) {
    const m = p2.match(/(\d{2,4})/);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 30 && val <= 1500) date.putereKw = val;
    }
  }

  // ── Culoare (câmpul V) ────────────────────────────────────────────────────
  const vRaw = extrageCamp(text, '\\bV\\b(?!IN)');
  if (vRaw) {
    // Respinge dacă are mai mult de 2 cuvinte sau conține caractere speciale — e garbage OCR
    const cuvinte = vRaw.trim().split(/\s+/);
    if (cuvinte.length <= 2 && /^[A-Za-zÀ-ž0-9\s]+$/.test(vRaw) && vRaw.length < 15) {
      date.culoare = vRaw.trim();
    }
  }

  // ── Număr locuri (câmpul S.1, valoare 1–9) ────────────────────────────────
  const s1 = extrageCamp(text, 'S[\\s.,]?1');
  if (s1) {
    const m = s1.match(/^(\d)/);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 1 && val <= 9) date.nrLocuri = val;
    }
  }

  // ── Date expirare viitoare (DD.MM.YYYY sau DD/MM/YYYY) ────────────────────
  const dataPattern = /\b(\d{2})[./](\d{2})[./](\d{4})\b/g;
  const dateViitoare = [];
  const acum = new Date();
  let m;
  while ((m = dataPattern.exec(text)) !== null) {
    const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    if (d > acum) dateViitoare.push(d);
  }
  if (dateViitoare.length > 0) date.dataITP = dateViitoare[0];
  if (dateViitoare.length > 1) date.dataRCA = dateViitoare[1];

  return date;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extrageCamp = (text, etichetaRegex) => {
  const regex = new RegExp(`${etichetaRegex}\\s*[:\\-.]?\\s*([^\\n\\r]{1,40})`, 'im');
  const m = text.match(regex);
  return m ? m[1].trim().replace(/\s+/g, ' ') : null;
};

const esteKodTehnic = (val) => {
  if (!val) return true;
  if (val.length > 20) return true;
  // Cod tehnic: începe cu cifră, sau are format "2C.XXX" sau șir pur alfanumeric scurt cu cifre
  return /^\d/.test(val) || /^[A-Z]{1,3}\d/.test(val) || /^[A-Z0-9]{6,}$/.test(val);
};

const normalizeazaModel = (val) => {
  if (!val) return null;
  return val.trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

const normalizeazaMarca = (text) => {
  if (!text) return null;
  const t = text.toUpperCase().trim();
  if (t.includes('VOLKSWAGEN') || t.startsWith('VW')) return 'Volkswagen';
  if (t.includes('DACI')) return 'Dacia';
  if (t.includes('BMW')) return 'BMW';
  if (t.includes('AUDI')) return 'Audi';
  if (t.includes('RENAULT')) return 'Renault';
  if (t.includes('MERCEDES')) return 'Mercedes-Benz';
  if (t.includes('SKODA') || t.includes('ŠKODA')) return 'Skoda';
  if (t.includes('TOYOTA')) return 'Toyota';
  if (t.includes('FORD')) return 'Ford';
  return null;
};

const detecteazaMarca = (text) => {
  const t = text.toUpperCase();
  if (/\bVOLKSWAGEN\b|\bVW\b/.test(t)) return 'Volkswagen';
  if (/\bDACI[AĂ]?\b/.test(t)) return 'Dacia';
  if (/\bBMW\b/.test(t)) return 'BMW';
  if (/\bAUDI\b/.test(t)) return 'Audi';
  if (/\bRENAULT\b/.test(t)) return 'Renault';
  if (/\bMERCEDES\b/.test(t)) return 'Mercedes-Benz';
  if (/\bSKODA\b|\bŠKODA\b/.test(t)) return 'Skoda';
  if (/\bTOYOTA\b/.test(t)) return 'Toyota';
  if (/\bFORD\b/.test(t)) return 'Ford';
  return null;
};

const normalizeazaCombustibil = (text) => {
  const t = text.toUpperCase();
  if (t.includes('MOTORIN') || t.includes('DIESEL')) return 'Motorina';
  if (t.includes('BENZIN') || t.includes('GASOLINE') || t.includes('PETROL')) return 'Benzina';
  if (t.includes('ELECTRIC')) return 'Electric';
  if (t.includes('HIBRID') || t.includes('HYBRID')) return 'Hibrid';
  if (t.includes('GPL') || t.includes('LPG')) return 'GPL';
  if (t.includes('GNC') || t.includes('CNG')) return 'GNC';
  return text.trim();
};

const detecteazaCombustibil = (text) => {
  const t = text.toUpperCase();
  if (/\bMOTORIN[AĂ]\b|\bDIESEL\b/.test(t)) return 'Motorina';
  if (/\bBENZIN[AĂ]\b|\bGASOLINE\b/.test(t)) return 'Benzina';
  if (/\bELECTRIC\b/.test(t)) return 'Electric';
  if (/\bHIBRID\b|\bHYBRID\b/.test(t)) return 'Hibrid';
  if (/\bGPL\b|\bLPG\b/.test(t)) return 'GPL';
  return null;
};

module.exports = { extrageText, parseazaDateVehicul };
