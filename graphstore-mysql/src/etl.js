var async = require('async'),
	deferred = require('deferred'),
	user = require('./user.js'),
	product = require('./product.js'),
	affinity = require('./affinity.js'),
	_ = require('underscore'),
	xml2js = require('xml2js');

function ETL( client ) {
	this.client = client;
}

var parser = new xml2js.Parser({explicitArray:false});

ETL.prototype.parseData = function( data ) {
	var def = deferred();
	parser.parseString(data, function (err, result) {
		def.resolve( result.info );
	} );
	return def.promise;
}

ETL.prototype.unpackRows = function( rows ) {
	var def = deferred();
	var self = this;
	async.each( rows, function( item, callback ) {
		self.parseData( item.user_data ).then( function( user ) {
			item.user = user;
			delete item.user_data;
			self.parseData( item.product_data ).then( function( product ) {
				item.product = product;
				delete item.product_data;
				callback( null, null );
			} );
		} );
	}, function( err ) {
		def.resolve();
	} );
	return def.promise;
}

ETL.prototype.synchronize = function() {
	var def = deferred();

	var u = new user( this.client );
	var p = new product( this.client );
	var a = new affinity( this.client );

	var self = this;
	u.getAll().then( function( users ) {
		var users_by_id = _.object( _.map( users, function(item) { return [item.id, item] } ) );

		var user_keys = {};
		_.each( users, function( item ) { _.each( _.keys(item.user), function( k ) { user_keys[ k ] = true; } ) } );
		user_keys = _.keys( user_keys );

		p.getAll().then( function( products ) {
			var products_by_id = _.object( _.map( products, function(item) { return [item.id, item] } ) );

			var product_keys = {};
			_.each( products, function( item ) { _.each( _.keys(item.product), function( k ) { product_keys[ k ] = true; } ) } );
			product_keys = _.keys( product_keys );

			a.getAll().then( function( affinity ) {
				async.series( [
					function( callback ) {
						self.client.query('DROP TABLE IF EXISTS etl', [], function(err, res) {
							if ( err ) console.log( err );
							callback(null,null);
						} );
					},
					function( callback ) {
						var cols = [];
						for( var k in user_keys ) { if ( user_keys[k] != 'id' ) cols.push( "user_"+user_keys[k]+" VARCHAR(255)"); }
						for( var k in product_keys ) { if ( product_keys[k] != 'id' ) cols.push( "product_"+product_keys[k]+" VARCHAR(255)"); }
						var sql = "CREATE TABLE etl ( user_id INT, product_id INT, relation VARCHAR( 255 ), " + cols.join(', ') + " )";
						self.client.query( sql, [], function(err, res) {
							if ( err ) console.log( err );
							callback(null,null);
						} );
					},
					function( callback ) {
						var fields = ['user_id','product_id','relation'];
						for( var k in user_keys ) { if ( user_keys[k] != 'id' ) fields.push( "user_"+user_keys[k] ); }
						for( var k in product_keys ) { if ( product_keys[k] != 'id' ) fields.push( "product_"+product_keys[k] ); }
						async.eachSeries( fields, function( field, scb ) {
							var sql = "CREATE INDEX etl_"+field+" ON etl ( "+field+" )";
							self.client.query( sql, [], function(err, res) {
								scb(null,null);
							} );
						}, function() {
							callback(null,null);
						} );
					},
					function( callback ) {
						async.eachSeries( affinity, function( aff, scb ) {
							var reps = ['?','?','?'];
							var fields = ['user_id','product_id','relation'];
							var values = [aff.user_id,aff.product_id,aff.relation];

							var user = users_by_id[ aff.user_id ];
							for( var k in user_keys ) {
								if( user_keys[k] != 'id' ) {
									reps.push( '?' );
									fields.push( "user_"+user_keys[k] );
									values.push( user.user[user_keys[k]] );
								}
							}

							var product = products_by_id[ aff.product_id ];
							for( var k in product_keys ) {
								if( product_keys[k] != 'id' ) {
									reps.push( '?' );
									fields.push( "product_"+product_keys[k] );
									values.push( product.product[product_keys[k]] );
								}
							}

							var sql = "INSERT INTO etl ( "+fields.join(',')+" ) VALUES ( "+reps.join(',')+" )";

							self.client.query( sql, values, function(err, res) {
								scb(null,null);
							} );

						}, function() {
							callback(null,null);
						} );
					}
				], function() {
					def.resolve( null );
				} );
			} );
		} );
	} );

	return def.promise;
}

ETL.prototype.query = function( relation, user_terms, product_terms ) {
	var def = deferred();

	var reps = ['?'];
	var values = [];
	var fields = [];
	if ( relation != null ) {
		values = [relation];
		fields = ['relation=?'];
	}

	for( var k in user_terms ) {
		reps.push('?');
		values.push( user_terms[k] );
		fields.push( 'user_'+k+'=?' );
	}

	for( var k in product_terms ) {
		reps.push('?');
		values.push( product_terms[k] );
		fields.push( 'product_'+k+'=?' );
	}

	var sql = 'SELECT product.id as product_id, product.data as product_data, user.id as user_id, user.data as user_data FROM etl, product, user WHERE etl.user_id=user.id AND etl.product_id=product.id AND '+fields.join(' AND ')+' ORDER BY user.id LIMIT 100';

	var self = this;
	this.client.query( sql, values, function(err, res) {
		if ( err ) console.log( err );
		self.unpackRows( res ).then( function() {
			def.resolve( res );
		} );
	} );

	return def.promise;
}

module.exports = ETL;
