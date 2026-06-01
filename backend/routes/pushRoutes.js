const express = require('express');
const router = express.Router();
const { getVapidKey, subscribe, unsubscribe, testNotificare, verificaAcum } = require('../controllers/pushController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/vapid', getVapidKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/test', testNotificare);
router.post('/verifica-acum', verificaAcum); // TEMPORAR (demo licență)

module.exports = router;
