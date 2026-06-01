const express = require('express');
const router = express.Router();
const { getIstoricVehicul, adaugaIntrare, actualizeazaIntrare, stergeIntrare } = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/vehicul/:vehiculId', getIstoricVehicul);
router.post('/vehicul/:vehiculId', adaugaIntrare);
router.put('/:id', actualizeazaIntrare);
router.delete('/:id', stergeIntrare);

module.exports = router;
