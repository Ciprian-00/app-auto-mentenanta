const Tesseract = require('tesseract.js');
const { Jimp, JimpMime } = require('jimp');

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

// Prag adaptiv local (Bradley) cu imagine integrală — robust la iluminare neuniformă.
// Calculează un prag separat pentru fiecare pixel pe baza mediei zonei din jur,
// deci se descurcă cu umbre/reflexii pe care un prag global fix le rateaza.
const pragAdaptiv = (data, width, height) => {
  const n = width * height;
  const gray = new Float64Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) gray[p] = data[i];

  // Imagine integrală (summed-area table) pentru medie de fereastră în O(1)
  const W = width + 1;
  const integral = new Float64Array(W * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * W + (x + 1)] = integral[y * W + (x + 1)] + rowSum;
    }
  }

  const radius = Math.max(8, Math.floor(width / 60)); // fereastra ~ proporțională
  const T = 0.12; // pixelul e text dacă e cu 12% sub media locală

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - radius);
    const y2 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - radius);
      const x2 = Math.min(width - 1, x + radius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * W + (x2 + 1)] -
        integral[y1 * W + (x2 + 1)] -
        integral[(y2 + 1) * W + x1] +
        integral[y1 * W + x1];
      const mean = sum / count;
      const v = gray[y * width + x] < mean * (1 - T) ? 0 : 255;
      const idx = (y * width + x) * 4;
      data[idx] = data[idx + 1] = data[idx + 2] = v;
    }
  }
};

// Preprocesează imaginea: scale + grayscale + auto-invert + prag adaptiv.
// O singură trecere, curată — text negru pe fond alb pentru Tesseract.
const preprocesareImagine = async (buffer) => {
  const img = await Jimp.read(buffer);

  const latime = img.bitmap.width;
  if (latime < 1500) {
    img.scale(2);                 // mărește pozele mici pentru detalii
  } else if (latime > 2400) {
    img.scale(2400 / latime);     // micșorează pozele mari (memorie + viteză)
  }

  img.greyscale().normalize();

  // Detectează fundalul: dacă imaginea e predominant întunecată → inversează,
  // ca textul să ajungă mereu închis pe fond deschis
  const d0 = img.bitmap.data;
  let suma = 0;
  for (let i = 0; i < d0.length; i += 4) suma += d0[i];
  if (suma / (d0.length / 4) < 110) img.invert();

  const { data, width, height } = img.bitmap;
  pragAdaptiv(data, width, height);

  return await img.getBuffer(JimpMime.png);
};

// Scanează documentul: preprocesare + OCR + parsare
const scaneazaDocument = async (buffer) => {
  let procesat;
  try {
    procesat = await preprocesareImagine(buffer);
  } catch (err) {
    console.warn('Preprocesare eșuată, folosesc originalul:', err.message);
    procesat = buffer;
  }
  const { data: { text } } = await Tesseract.recognize(procesat, 'ron+eng', {
    logger: () => {}
  });
  return { textBrut: text, dateExtrase: parseazaDateVehicul(text) };
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

  // Fallback: OCR confundă uneori litere (ex. V→Y), deci prefixul WMI nu se
  // potrivește. Ia primul bloc de 17 caractere cu structură validă de VIN
  // (începe cu literă, fără I/O/Q care nu apar niciodată într-un VIN).
  if (!date.vin) {
    for (const candidat of vinCandidati) {
      if (/^[A-HJ-NPR-Z][A-HJ-NPR-Z0-9]{16}$/.test(candidat)) {
        date.vin = candidat;
        break;
      }
    }
  }

  // Corectează confuziile OCR din VIN: I→1, O→0, Q→0 (aceste litere nu apar
  // niciodată într-un VIN, deci orice apariție e de fapt o cifră citită greșit).
  if (date.vin) {
    date.vin = date.vin.replace(/I/g, '1').replace(/O/g, '0').replace(/Q/g, '0');
  }

  // ── Număr de înmatriculare — validat față de coduri județe ────────────────
  // Separatorul dintre componente: spații, liniuță (-), cratimă lungă (–—),
  // dar și caractere pe care OCR le confundă cu liniuța: "=", ".", "~"
  // OCR redă adesea "SV-67-CPY", "SV —67-CPY" sau "SV-67=CPY"
  const SEP = '[\\s\\-–—=.~]*';

  // Strategie 1: lângă eticheta A
  const aLabelMatch = text.match(new RegExp(`(?:^|\\n)\\s*A\\b[^A-Z\\n]{0,8}([A-Z]{1,2})${SEP}(\\d{2,3})${SEP}([A-Z]{2,3})`, 'im'));
  if (aLabelMatch && CODURI_JUDETE.has(aLabelMatch[1].toUpperCase())) {
    date.numarInmatriculare = `${aLabelMatch[1].toUpperCase()} ${aLabelMatch[2]} ${aLabelMatch[3].toUpperCase()}`;
  }
  // Strategie 2: oriunde în text cu validare județ (cu sau fără liniuțe).
  // Case-insensitive — OCR redă uneori litere mici (ex. "SV-67-CpY")
  if (!date.numarInmatriculare) {
    const numarRegex = new RegExp(`([A-Za-z]{1,2})${SEP}(\\d{2,3})${SEP}([A-Za-z]{2,3})`, 'gi');
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

  // ── An fabricație = data primei înmatriculări (câmpul B) ──────────────────
  // STRICT din câmpul B (eticheta B, uneori OCR ca "8"), ca să nu confundăm cu
  // data eliberării certificatului sau alte date (ex. certificare filtru particule).
  // Dacă B nu e lizibil, anul rămâne null — se alege manual (combinarea trecerilor
  // OCR crește șansa ca B să fie citit într-una dintre treceri).
  // An fabricație ≈ data primei înmatriculări = cel mai vechi an de pe talon.
  // Datele oficiale (prima înmatriculare, eliberare) folosesc punct/spațiu ca
  // separator (07.04.2006). Certificarea filtrului de particule folosește liniuțe
  // (28-01-2021), deci NU se potrivește și nu poluează rezultatul. Acceptăm și
  // date lipite de OCR (07042006) sau cu ziua pe o cifră (7.042006).
  const aniGasiti = [];
  const dataRegex = /(\d{1,2})[.\s]{0,2}(\d{1,2})[.\s]{0,2}(19[6-9]\d|20[0-2]\d)/g;
  let md;
  while ((md = dataRegex.exec(text)) !== null) {
    const zi = parseInt(md[1]), luna = parseInt(md[2]), an = parseInt(md[3]);
    if (zi >= 1 && zi <= 31 && luna >= 1 && luna <= 12) aniGasiti.push(an);
  }
  if (aniGasiti.length > 0) date.an = Math.min(...aniGasiti);

  // ── Combustibil ───────────────────────────────────────────────────────────
  const p3 = extrageCamp(text, 'P[\\s.,]?3');
  if (p3) date.combustibil = normalizeazaCombustibil(p3);
  if (!date.combustibil) date.combustibil = detecteazaCombustibil(text);

  // ── Cilindree (capacitate cilindrică, câmpul P.1, 600–7000 cm³) ───────────
  // OCR pierde uneori o cifră (1968 → 968) sau strică eticheta (P.1 → PT).
  // Adunăm candidați din DOUĂ surse și preferăm o valoare de 4 cifre:
  //   1. numărul de după eticheta P.1
  //   2. numărul de 4 cifre imediat înaintea etichetei P.2 (P.1 e chiar înainte)
  const ccCandidati = [];

  const p1Regex = /P[\s.,]?1[\s:.\-]*(\d{3,5})/gi;
  let mc;
  while ((mc = p1Regex.exec(text)) !== null) {
    const val = parseInt(mc[1]);
    if (val >= 600 && val <= 7000) ccCandidati.push(val);
  }

  const p2idx = text.search(/P[\s.,]?2/);
  if (p2idx > 0) {
    const inainte = text.substring(Math.max(0, p2idx - 30), p2idx);
    for (const n of inainte.match(/\d{4}/g) || []) {
      const v = parseInt(n);
      if (v >= 1000 && v <= 6999) ccCandidati.push(v);
    }
  }

  if (ccCandidati.length > 0) {
    const patruCifre = ccCandidati.filter(v => v >= 1000);
    date.cilindree = patruCifre.length > 0 ? patruCifre[0] : ccCandidati[0];
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
  // Fallback: label P.2 citit greșit de OCR — caută prima valoare numerică rezonabilă
  // din zona textului unde apare marca (aceeași linie din certificat)
  if (!date.putereKw && date.marca) {
    const marcaIdx = text.toUpperCase().indexOf(date.marca.toUpperCase());
    if (marcaIdx >= 0) {
      const zona = text.substring(marcaIdx, Math.min(marcaIdx + 150, text.length));
      const mkw = zona.match(/\b(\d{2,3})\b/);
      if (mkw) {
        const val = parseInt(mkw[1]);
        if (val >= 50 && val <= 400) date.putereKw = val;
      }
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

  // Data ITP NU se extrage automat: pe certificat apar mai multe date (prima
  // înmatriculare, eliberare, valabilitate ITP), iar ITP-ul real e adesea un
  // sticker scris de mână pe care OCR nu-l poate citi corect. Se completează
  // manual în formular ca să nu sugerăm o dată greșită. dataITP/dataRCA rămân null.

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
  // Fără word-boundary — OCR lipește des eticheta de valoare (ex. "PSMOTORINA")
  const t = text.toUpperCase();
  if (t.includes('MOTORIN') || t.includes('DIESEL')) return 'Motorina';
  if (t.includes('BENZIN') || t.includes('GASOLINE')) return 'Benzina';
  if (t.includes('ELECTRIC')) return 'Electric';
  if (t.includes('HIBRID') || t.includes('HYBRID')) return 'Hibrid';
  if (/\bGPL\b|\bLPG\b/.test(t)) return 'GPL';
  return null;
};

module.exports = { scaneazaDocument, parseazaDateVehicul };
