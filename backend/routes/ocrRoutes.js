const express = require('express');
const router = express.Router();
const { proceseazaImagine } = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/proceseaza', protect, upload.single('imagine'), proceseazaImagine);

module.exports = router;