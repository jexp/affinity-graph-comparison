var gs_es = require('graphstore-elasticsearch');
var gs_mem = require('graphstore-memory');
var gs_mysql = require('graphstore-mysql');
var gs_mongo = require('graphstore-mongo');
var gs_neo = require('graphstore-neo4j');
var argv = require('optimist').demand(['name']).argv;
var tester = require('./tester.js');
var async = require('async');

async.eachSeries( [
	new gs_es(),
	new gs_mem(),
	new gs_mysql(),
	new gs_mongo(),
	new gs_neo()
], function( item, cb1 ) {
	async.eachSeries( item.configurations(), function( item, cb2 ) {
		var name = item[0];
		var run = true;
		if ( argv.only != null ) {
			if ( argv.only != name )
				run = false;
		}
		if ( run ) {
			var m = item[1];
			tester( m, {
					data_set: argv.name,
					noload: argv.noload ? true : false
				},
				function( str ) {
					if( argv.verbose )
						console.log( str );
				},
				function( results ) {
					console.log( name+"\t"+results.query+"\t"+results.results );
					cb2( null, null );
				} );
		} else {
			cb2( null, null );
		}
	}, function() {
		cb1( null, null );
	} );
} );
