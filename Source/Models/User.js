const Sequelize = require('sequelize');
const sequelize = require('../Server/Sequelize');

const User = sequelize.define('user', {
	id: {
		type: Sequelize.UUID,
		primaryKey: true
	},
	username: {
		type: Sequelize.STRING
	},
});

User.sync();

module.exports = User;