var async = require('async'),
	deferred = require('deferred');

var utils = {
	clean: function( client ) {
		var def = deferred();

		async.series( [
			function( callback ) {
				client.query('DELETE FROM user', [], function(err, result) {
					callback(null,null);
				} );
			},
			function( callback ) {
				client.query('DELETE FROM user_kv', [], function(err, result) {
					callback(null,null);
				} );
			},
			function( callback ) {
				client.query('DELETE FROM product', [], function(err, result) {
					callback(null,null);
				} );
			},
			function( callback ) {
				client.query('DELETE FROM product_kv', [], function(err, result) {
					callback(null,null);
				} );
			},
			function( callback ) {
				client.query('DELETE FROM affinity', [], function(err, result) {
					callback(null,null);
				} );
			}
		], function( result ) {
			def.resolve();
		} );
		return def.promise;
	}
};

module.exports = utils;