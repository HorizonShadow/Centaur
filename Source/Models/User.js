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
	about: {
		type: Sequelize.STRING
	}
});

User.prototype.details = function() {
	return {
		userAbout: this.about
	}
}

User.prototype.getSerializeableObject = function() {
	return {
		username: this.username,
		details: this.details()
	}
}

User.sync({force: true});

module.exports = User;