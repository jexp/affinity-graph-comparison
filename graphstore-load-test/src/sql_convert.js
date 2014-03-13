var byline = require('byline');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var argv = require('optimist').demand(['name']).argv;

var data_set = argv.name;

var users_by_id = {};
var products_by_id = {};

async.series([
	function( callback ) {
		console.log("Loading users");
		byline(fs.createReadStream('data/'+data_set+'/users.json', { encoding: 'utf8' })).on('data', function(line) {
			var user = JSON.parse( line );
			users_by_id[ user.id ] = user;
		}).on('finish',function() {
			callback(null,null);
		});
	},
	function( callback ) {
		console.log("Loading products");
		byline(fs.createReadStream('data/'+data_set+'/products.json', { encoding: 'utf8' })).on('data', function(line) {
			var product = JSON.parse( line );
			products_by_id[ product.id ] = product;
		}).on('finish',function() {
			callback(null,null);
		});
	},
	function( callback ) {
		console.log("Loading affinities");

		var first = true;
		var index_fields = [];

	    fs.open(__dirname+'/../data/'+data_set+'/complete.sql', 'w', 0666, function(err, fd) {
			byline(fs.createReadStream('data/'+data_set+'/affinities.json', { encoding: 'utf8' })).on('data', function(line) {
				var row = JSON.parse( line );

				var user = users_by_id[ row.user_id ];
				for ( var k in user ) { row["user_"+k] = user[k]; }
				var product = products_by_id[ row.product_id ];
				for ( var k in product ) { row["product_"+k] = product[k]; }

				var fields = [];
				var values = [];
				for( var k in row ) {
					fields.push( k );
					if ( k == 'user_id' || k == 'product_id' ) {
						values.push( row[k] );
					} else {
						var text = row[ k ];
						text = text.replace(/'/g,'');
						values.push( "'" + text + "'" );
					}
				}

				if ( first ) {
					var field_defs = [];
					for( var k in row ) {
						if ( k != "user_id" && k != "product_id" ) {
							field_defs.push( k + " VARCHAR(255)" );
							index_fields.push( k );
						}
					}
					fs.writeSync( fd, "DROP TABLE IF EXISTS etl;\nCREATE TABLE etl ( user_id INT, product_id INT, "+field_defs+" );\n" )
					first = false;
				}

				fs.writeSync( fd, "INSERT INTO etl ( " + fields.join(", ") + " ) VALUES ( " + values.join(", ") + " );\n" );
			}).on('finish',function() {
				for( var k in index_fields ) {
					fs.writeSync( fd, "CREATE INDEX etl_"+index_fields[k]+" ON etl ( "+index_fields[k]+" );\n" );
				}
				callback(null,null);
			});
		});
	}
],function(){
});
