var Model = require('./model');

function Product(client) {
    Model.call(this, client, 'Product');
}

Product.prototype = Object.create(Model.prototype);

Product.prototype.constructor = Product;

module.exports = Product;
