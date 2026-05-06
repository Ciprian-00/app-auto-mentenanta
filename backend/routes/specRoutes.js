const express = require('express');
const router = express.Router();
const {
  getSpec,
  getAllSpecs,
  getModele,
  getMotorizari,
  adaugaSpec,
  actualizeazaSpec,
  stergeSpec
} = require('../controllers/specController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllSpecs);
router.get('/cauta', getSpec);
router.get('/modele', getModele);
router.get('/motorizari', getMotorizari);

router.post('/', adaugaSpec);
router.put('/:id', actualizeazaSpec);
router.delete('/:id', stergeSpec);

module.exports = router;