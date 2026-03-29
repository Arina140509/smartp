const express = require('express');
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  completeEvent
} = require('../controllers/eventController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/complete', completeEvent);

module.exports = router;