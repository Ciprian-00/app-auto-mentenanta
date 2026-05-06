const { extrageText, parseazaDateVehicul } = require('../services/ocrService');

const proceseazaImagine = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mesaj: 'Nu a fost incarcata nicio imagine' });
    }

    console.log('Procesez imaginea:', req.file.originalname, req.file.size, 'bytes');

    // req.file.buffer — imagine în memorie (memory storage)
    const textExtras = await extrageText(req.file.buffer);

    console.log('\n=== TEXT BRUT OCR ===\n', textExtras, '\n====================\n');

    const dateVehicul = parseazaDateVehicul(textExtras);

    console.log('DATE EXTRASE:', JSON.stringify(dateVehicul, null, 2));

    res.json({
      succes: true,
      textBrut: textExtras,
      dateExtrase: dateVehicul
    });

  } catch (error) {
    console.error('Eroare OCR:', error.message);
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { proceseazaImagine };
