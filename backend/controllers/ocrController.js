const { extrageText, parseazaDateVehicul } = require('../services/ocrService');
const path = require('path');
const fs = require('fs');

const proceseazaImagine = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mesaj: 'Nu a fost incarcata nicio imagine' });
    }

    const caleImagine = path.join(__dirname, '..', req.file.path);

    console.log('Procesez imaginea:', caleImagine);

    const textExtras = await extrageText(caleImagine);
    const dateVehicul = parseazaDateVehicul(textExtras);

    // Sterge imaginea dupa procesare
    fs.unlink(caleImagine, (err) => {
      if (err) console.error('Eroare stergere imagine:', err);
    });

    res.json({
      succes: true,
      textBrut: textExtras,
      dateExtrase: dateVehicul
    });

  } catch (error) {
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { proceseazaImagine };