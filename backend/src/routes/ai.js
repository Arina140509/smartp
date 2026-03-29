const express = require('express');
const auth = require('../middleware/auth');
const SchedulerService = require('../services/schedulerService');

const router = express.Router();

router.use(auth);

router.post('/suggest', async (req, res) => {
  try {
    const { tasks, busySlots, date } = req.body;
    const scheduler = new SchedulerService(req.user);

    const result = await scheduler.suggestSchedule(
      tasks,
      busySlots,
      date ? new Date(date) : new Date()
    );

    res.json(result);
  } catch (error) {
    console.error('Scheduler error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;