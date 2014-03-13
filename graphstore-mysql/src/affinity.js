var async = require('async');
var deferred = require('deferred');

function Affinity( client ) {
    "use strict";
    this.client = client;
}

Affinity.prototype.create = function( user_id, product_id, relation ) {
    "use strict";

    var def = deferred();

	var id = null;
	var self = this;
	async.series( [
		function( callback ) {
			self.client.query('INSERT INTO affinity VALUES (0,?,?,?)', [ product_id, user_id, relation ], function(err, result) {
				callback(null);
			} );
		},
		function( callback ) {
			self.client.query('SELECT LAST_INSERT_ID() AS id', [], function(err, result) {
				id = result[0].id;
				callback(null,result[0].id);
			} );
		}
	],
	function( err, result ) {
		def.resolve( id );
	} );

	return def.promise;
}

Affinity.prototype.getByUser = function( user_id ) {
    "use strict";

    var def = deferred();
	this.client.query("SELECT product.* FROM affinity, product WHERE user_id=? AND affinity.product_id = product.id", [user_id], function(err, result) {
		def.resolve( result );
	} );
	return def.promise;
};

Affinity.prototype.getAll = function( ) {
    "use strict";

    var def = deferred();
	this.client.query("SELECT * FROM affinity", [], function(err, result) {
		def.resolve( result );
	} );
	return def.promise;
};

Affinity.prototype.getByProduct = function( product_id ) {
    "use strict";

    var def = deferred();

	this.client.query("SELECT user.* FROM affinity, user WHERE product_id=? AND user.id = affinity.user_id", [product_id], function(err, result) {
		def.resolve( result );
	} );

	return def.promise;
};

module.exports = Affinity;