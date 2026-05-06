const express = require('express');
const router = express.Router();
const { getRemindere, genereaza, dismiss } = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getRemindere);
router.post('/genereaza/:vehiculId', genereaza);
router.put('/:id/dismiss', dismiss);

module.exports = router;