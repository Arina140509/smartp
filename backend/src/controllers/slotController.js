const { TimeSlot } = require('../models');
const { Op } = require('sequelize');

exports.getSlots = async (req, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.userId;

    const where = { user_id: userId };

    if (start && end) {
      where.start_time = {
        [Op.gte]: new Date(start),
        [Op.lte]: new Date(end)
      };
    }

    const slots = await TimeSlot.findAll({
      where,
      order: [['start_time', 'ASC']]
    });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { title, start_time, end_time, is_recurring, day_of_week } = req.body;
    const userId = req.userId;

    const slot = await TimeSlot.create({
      user_id: userId,
      title,
      start_time,
      end_time,
      is_recurring: is_recurring || false,
      day_of_week
    });

    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const slot = await TimeSlot.findOne({
      where: { id, user_id: userId }
    });

    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    await slot.update(req.body);

    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const slot = await TimeSlot.findOne({
      where: { id, user_id: userId }
    });

    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    await slot.destroy();

    res.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};