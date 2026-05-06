const express = require('express');
const router = express.Router();
const {
  adaugaVehicul,
  getVehicule,
  getVehicul,
  actualizeazaKilometraj,
  stergeVehicul,
  getRecomandari,
  actualizeazaVehicul
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', adaugaVehicul);
router.get('/', getVehicule);
router.get('/:id', getVehicul);
router.put('/:id', actualizeazaVehicul);
router.put('/:id/kilometraj', actualizeazaKilometraj);
router.delete('/:id', stergeVehicul);
router.get('/:id/recomandari', getRecomandari);

module.exports = router;