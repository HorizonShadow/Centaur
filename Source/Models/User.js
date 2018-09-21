const Sequelize = require('sequelize');
const sequelize = require('../Server/Sequelize');

const User = sequelize.define('user', {
	id: {
		type: Sequelize.UUID,
		primaryKey: true
	}
});

User.sync();

module.exports = User;