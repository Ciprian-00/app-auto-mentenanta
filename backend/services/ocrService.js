const Tesseract = require('tesseract.js');
const path = require('path');

// Extrage text din imagine
const extrageText = async (caleImagine) => {
  const { data: { text } } = await Tesseract.recognize(
    caleImagine,
    'ron+eng',
    {
      logger: m => console.log(m)
    }
  );
  return text;
};

// Parseaza datele din textul extras
const parseazaDateVehicul = (text) => {
  const date = {
    marca: null,
    model: null,
    an: null,
    vin: null,
    numarInmatriculare: null,
    dataITP: null,
    dataRCA: null
  };

  // Cauta numarul de inmatriculare (format Romania: 2 litere + 2 cifre + 3 litere)
  const numarPattern = /\b([A-Z]{1,2})\s*(\d{2})\s*([A-Z]{3})\b/;
  const numarMatch = text.match(numarPattern);
  if (numarMatch) {
    date.numarInmatriculare = `${numarMatch[1]} ${numarMatch[2]} ${numarMatch[3]}`;
  }

  // Cauta VIN (17 caractere alfanumerice)
  const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/;
  const vinMatch = text.match(vinPattern);
  if (vinMatch) {
    date.vin = vinMatch[1];
  }

  // Cauta anul fabricatiei (4 cifre intre 1990 si 2026)
  const anPattern = /\b(199[0-9]|200[0-9]|201[0-9]|202[0-6])\b/;
  const anMatch = text.match(anPattern);
  if (anMatch) {
    date.an = parseInt(anMatch[1]);
  }

  // Cauta date calendaristice format DD.MM.YYYY sau DD/MM/YYYY
  const dataPattern = /\b(\d{2})[./](\d{2})[./](\d{4})\b/g;
  const dateGasite = [];
  let match;
  while ((match = dataPattern.exec(text)) !== null) {
    dateGasite.push(new Date(`${match[3]}-${match[2]}-${match[1]}`));
  }

  // Prima data gasita dupa azi e probabil expirarea unui document
  const acum = new Date();
  const dateViitoare = dateGasite.filter(d => d > acum);
  if (dateViitoare.length > 0) {
    date.dataITP = dateViitoare[0];
  }

  // Cauta marca in text
  const marci = ['Volkswagen', 'VW', 'Dacia', 'BMW', 'Audi', 'Renault', 'Mercedes'];
  for (const marca of marci) {
    if (text.toUpperCase().includes(marca.toUpperCase())) {
      date.marca = marca === 'VW' ? 'Volkswagen' : marca;
      if (marca === 'Mercedes') date.marca = 'Mercedes-Benz';
      break;
    }
  }

  return date;
};

module.exports = { extrageText, parseazaDateVehicul };