const express = require('express');
const router = express.Router();
const { register, login, getProfil, actualizeazaProfil, schimbaParola, actualizeazaSetari, stergeContul } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profil', protect, getProfil);
router.put('/profil', protect, actualizeazaProfil);
router.put('/parola', protect, schimbaParola);
router.put('/setari', protect, actualizeazaSetari);
router.delete('/cont', protect, stergeContul);

module.exports = router;