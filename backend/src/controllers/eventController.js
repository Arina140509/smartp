const { Event } = require('../models');
const { Op } = require('sequelize');

exports.getEvents = async (req, res) => {
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

    const events = await Event.findAll({
      where,
      order: [['start_time', 'ASC']]
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time, priority, estimated_duration } = req.body;
    const userId = req.userId;

    const event = await Event.create({
      user_id: userId,
      title,
      description,
      start_time,
      end_time,
      priority,
      estimated_duration: estimated_duration || null,
      status: 'pending'
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const event = await Event.findOne({
      where: { id, user_id: userId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.update(req.body);

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const event = await Event.findOne({
      where: { id, user_id: userId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const event = await Event.findOne({
      where: { id, user_id: userId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.update({
      status: 'completed',
      completed_at: new Date()
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};