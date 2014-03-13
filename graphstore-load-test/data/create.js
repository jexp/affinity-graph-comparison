#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var csv = require('csv');
var Charlatan = require('charlatan');
var argv = require('optimist').demand(['count','name']).argv;

function pick_from( values, index ) {
	return values[ index % values.length ];
}

var max_users = argv.count;
var max_products = Math.floor( max_users / 3 );
var max_connections = max_users * 2;

fs.mkdir(__dirname+'/'+argv.name, function( err ) {
	async.series([
		function( callback ) {
			console.log('Creating users');

		    fs.open(__dirname+'/'+argv.name+'/users.json', 'w', 0666, function(err, fd) {
				for( var index = 0; index < max_users; index++ ) {
					var user = {
						id: index + 1,
						email: Charlatan.Internet.email(),
						first: Charlatan.Name.firstName(),
						last: Charlatan.Name.lastName(),
						hair: pick_from( ['red','black','blond','green' ], index ),
						region: pick_from( ['west','central','east','north' ], index )
					}
					fs.writeSync( fd, JSON.stringify( user ) + "\n" );
				}
				callback( null );
			});
		},
 		function( callback ) {
			console.log('Creating products');

		    fs.open(__dirname+'/'+argv.name+'/products.json', 'w', 0666, function(err, fd) {
				for( var index = 0; index < max_products; index++ ) {
					var product = {
						id: index + 1,
						vendor: Charlatan.Company.name(),
						name: Charlatan.Lorem.sentence(),
						type: pick_from( ['blu-ray','CD','DVD','download' ], index )
					}
					fs.writeSync( fd, JSON.stringify( product ) + "\n" );
				}
				callback( null );
			});
		},
		function( callback ) {
			console.log('Creating affinities');

		    fs.open(__dirname+'/'+argv.name+'/affinities.json', 'w', 0666, function(err, fd) {
				for( var index = 0; index < max_connections; index++ ) {
					var uid = ( index % max_users ) + 1;
					var pid = ( index % max_products ) + 1;
					var affinity = {
						user_id: uid,
						product_id: pid,
						relation: pick_from( ['follow','own','meh' ], index )
					}
					fs.writeSync( fd, JSON.stringify( affinity ) + "\n" );
				}
				callback( null, null );
			});
		}
	]);
} );

