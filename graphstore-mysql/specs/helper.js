var async = require('async'),
	product = require('../src/product.js'),
	user = require('../src/user.js'),
	affinity = require('../src/affinity.js'),
	deferred = require('deferred');

var helper = {
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
	},
	sampleProducts: [
		{ uuid: 'uu1', url: 'http://foobar.com/1', name: 'bray1', terms:{ foobar: 'baz', name: 'bray1' } },
		{ uuid: 'uu2', url: 'http://foobar.com/2', name: 'bray2', terms:{ foobar: 'baz', name: 'bray2' } },
		{ uuid: 'uu3', url: 'http://foobar.com/3', name: 'bray3', terms:{ foobar: 'bar', name: 'bray3' } }
	],
	sampleUsers: [
		{ name: 'jack', terms:{ foobar: 'baz', first: 'Jack', last: 'Herrington', age: 30 } },
		{ name: 'tom', terms:{ foobar: 'baz', first: 'Tom', last: 'Baker', age: 30 } },
		{ name: 'lori', terms:{ foobar: 'bar', first: 'Lori', last: 'Herrington', age: 35 } }
	],
	sampleAffinities: [
		{ user: 0, product: 0, relation: 'like' },
		{ user: 0, product: 1, relation: 'like' },
		{ user: 0, product: 2, relation: 'like' },
		{ user: 1, product: 1, relation: 'like' },
		{ user: 1, product: 2, relation: 'own' },
		{ user: 2, product: 0, relation: 'own' },
		{ user: 2, product: 2, relation: 'own' }
	],
	createUsers: function( user, list ) {
		var def = deferred();
		var users = [];
		async.each( list, function( item, callback ) {
			user.create( item.name, item.terms ).then( function( id ) {
				user.get( id ).then( function( u ) {
					users.push( u );
					callback( null );
				} );
			} );
		}, function( err ) {
			def.resolve( users );
		} );
		return def.promise;
	},
	createProducts: function( product, list ) {
		var def = deferred();
		var products = [];
		async.each( list, function( item, callback ) {
			product.create( item.uuid, item.url, item.name, item.terms ).then( function( id ) {
				product.get( id ).then( function( u ) {
					products.push( u );
					callback( null );
				} );
			} );
		}, function( err ) {
			def.resolve( products );
		} );
		return def.promise;
	},
	createAffinities: function( users, products, list, affinity ) {
		var def = deferred();
		async.each( list, function( item, callback ) {
			affinity.create( users[ item.user ].id, products[ item.product ].id, item.relation ).then( function( id ) {
				callback( null );
			} );
		}, function( err ) {
			def.resolve();
		} );
		return def.promise;
	},
	setupSampleData: function( client ) {
		var def = deferred();
		var p = new product(client), u = new user(client), a = new affinity(client);
		helper.createProducts( p, helper.sampleProducts ).then(function(products){
			expect(products.length).toBe( helper.sampleProducts.length );

			helper.createUsers( u, helper.sampleUsers ).then(function(users){
				expect(users.length).toBe( helper.sampleUsers.length );

				helper.createAffinities( users, products, helper.sampleAffinities, a ).then( function( result ) {
					def.resolve();
				} );
			});
		});
		return def.promise;
	}
};
module.exports = helper;