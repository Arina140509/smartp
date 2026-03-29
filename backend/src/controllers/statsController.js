const { Event } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await Event.findAll({
      where: {
        user_id: userId,
        start_time: {
          [Op.gte]: startDate
        }
      }
    });

    const totalTasks = events.length;
    const completedTasks = events.filter(e => e.status === 'completed').length;
    const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks * 100);

    // Статистика по дням
    const dailyStats = {};
    events.forEach(event => {
      const date = event.start_time.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, completed: 0 };
      }
      dailyStats[date].total++;
      if (event.status === 'completed') {
        dailyStats[date].completed++;
      }
    });

    const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      rate: stats.total === 0 ? 0 : (stats.completed / stats.total * 100)
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Статистика по приоритетам
    const priorityStats = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 }
    };

    events.forEach(event => {
      priorityStats[event.priority].total++;
      if (event.status === 'completed') {
        priorityStats[event.priority].completed++;
      }
    });

    // Часы продуктивности
    const hourlyStats = Array(24).fill().map(() => ({ total: 0, completed: 0 }));
    events.forEach(event => {
      const hour = event.start_time.getHours();
      hourlyStats[hour].total++;
      if (event.status === 'completed') {
        hourlyStats[hour].completed++;
      }
    });

    const hourlyProductivity = hourlyStats.map((stat, hour) => ({
      hour,
      total: stat.total,
      completed: stat.completed,
      rate: stat.total === 0 ? 0 : (stat.completed / stat.total * 100)
    }));

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionRate: Math.round(completionRate)
      },
      dailyData,
      priorityStats,
      hourlyProductivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};