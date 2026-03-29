const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const TimeSlot = require('./TimeSlot');

// Associations
User.hasMany(Event, { foreignKey: 'user_id' });
Event.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(TimeSlot, { foreignKey: 'user_id' });
TimeSlot.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Event,
  TimeSlot
};