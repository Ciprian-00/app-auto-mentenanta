const { scaneazaDocument } = require('../services/ocrService');

const proceseazaImagine = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mesaj: 'Nu a fost incarcata nicio imagine' });
    }

    console.log('Procesez imaginea:', req.file.originalname, req.file.size, 'bytes');

    // Mai multe treceri OCR (preprocesări diferite) + combinarea rezultatelor
    const { textBrut, dateExtrase } = await scaneazaDocument(req.file.buffer);

    console.log('\n=== TEXT BRUT OCR ===\n', textBrut, '\n====================\n');
    console.log('DATE EXTRASE:', JSON.stringify(dateExtrase, null, 2));

    res.json({
      succes: true,
      textBrut,
      dateExtrase
    });

  } catch (error) {
    console.error('Eroare OCR:', error.message);
    res.status(500).json({ mesaj: error.message });
  }
};

module.exports = { proceseazaImagine };
