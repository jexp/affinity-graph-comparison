var mysql = require('mysql'),
	query = require('../src/query.js'),
	helper = require('./helper.js');

describe("query", function() {
	var client = null, q = null;

	beforeEach(function() {
		client = mysql.createConnection({host: 'localhost', user: 'root',password: '',database: 'affinity'});
		client.connect();

		q = new query(client);

		var done = false;
		helper.clean(client).then(function() { done = true; });
		waitsFor(function() { return done; });
	});

	afterEach(function(){
		client.end();
	});

	it("should query open ended - by xml", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byXML('like',{},{}).then( function( result ) {
				expect(result.length).toBe( 4 );
				done();
			} );
		});
	});

	it("should query open ended - by ev", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byEV('like',{},{}).then( function( result ) {
				expect(result.length).toBe( 4 );
				done();
			} );
		});
	});

	it("should query for users - by xml", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byXML('like',{first:'Jack'},{}).then( function( result ) {
				expect(result.length).toBe( 3 );
				done();
			} );
		});
	});

	it("should query for users - by ev", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byEV('like',{first:'Jack'},{}).then( function( result ) {
				expect(result.length).toBe( 3 );
				done();
			} );
		});
	});

	it("should query for products - by xml", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byXML('like',{},{name:'bray1'}).then( function( result ) {
				expect(result.length).toBe( 1 );
				done();
			} );
		});
	});

	it("should query for products - by ev", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byEV('like',{},{name:'bray1'}).then( function( result ) {
				expect(result.length).toBe( 1 );
				done();
			} );
		});
	});

	it("should query for users - by xml", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byXML('like',{first:'Jack'},{name:'bray1'}).then( function( result ) {
				expect(result.length).toBe( 1 );
				done();
			} );
		});
	});

	it("should query for users - by ev", function(done) {
		helper.setupSampleData( client ).then(function( ) {
			q.byEV('like',{first:'Jack'},{name:'bray1'}).then( function( result ) {
				expect(result.length).toBe( 1 );
				done();
			} );
		});
	});
});