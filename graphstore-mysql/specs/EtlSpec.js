var mysql = require('mysql'),
	etl = require('../src/etl.js'),
	helper = require('./helper.js');

describe("etl", function() {
	var client = null, q = null;

	beforeEach(function() {
		client = mysql.createConnection({host: 'localhost', user: 'root',password: '',database: 'affinity'});
		client.connect();

		e = new etl(client);

		var done = false;
		helper.clean(client).then(function() { done = true; });
		waitsFor(function() { return done; });
	});

	afterEach(function(){
		client.end();
	});

	it("should synchronize", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			e.synchronize().then( function( result ) {
				done();
			} );
		});
	});

	it("should query against said ETL by like", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			e.synchronize().then( function( result ) {
				e.query('like',{},{}).then( function( result ) {
					expect(result.length).toBe( 4 );
					done();
				} );
			} );
		});
	});

	it("should query against said ETL by user terms", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			e.synchronize().then( function( result ) {
				e.query('like',{first:'Jack'},{}).then( function( result ) {
					expect(result.length).toBe( 3 );
					done();
				} );
			} );
		});
	});

	it("should query against said ETL by product terms", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			e.synchronize().then( function( result ) {
				e.query('like',{},{name:'bray1'}).then( function( result ) {
					expect(result.length).toBe( 1 );
					done();
				} );
			} );
		});
	});

	it("should query against said ETL by product and user terms", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			e.synchronize().then( function( result ) {
				e.query('like',{first:'Jack'},{name:'bray1'}).then( function( result ) {
					expect(result.length).toBe( 1 );
					done();
				} );
			} );
		});
	});
});