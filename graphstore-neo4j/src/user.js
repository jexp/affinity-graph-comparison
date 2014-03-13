var Model = require('./model');

function User(client) {
    Model.call(this, client, 'User');
}

User.prototype = Object.create(Model.prototype);

User.prototype.constructor = User;

module.exports = User;
