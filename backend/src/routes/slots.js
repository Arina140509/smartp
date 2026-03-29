const express = require('express');
const {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getSlots);
router.post('/', createSlot);
router.put('/:id', updateSlot);
router.delete('/:id', deleteSlot);

module.exports = router;