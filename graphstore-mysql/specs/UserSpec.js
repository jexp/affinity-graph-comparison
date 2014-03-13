var mysql = require('mysql'),
	user = require('../src/user.js'),
	helper = require('./helper.js');

describe("user", function() {
	var client = null, u = null;

	beforeEach(function() {
		var done;
		client = mysql.createConnection({host: 'localhost',user: 'root',password: '',database: 'affinity'});
		client.connect();

		u = new user(client);

		done = false;
		helper.clean(client).then(function() { done = true; });
		waitsFor(function() { return done; });
	});

	afterEach(function(){
		client.end();
	});

	it("should create a user", function(done) {
		u.create('jack', {
			foobar: 'baz'
		}).then(function(id) {
			expect(id).not.toBe(null);
			done();
		});
	});

	it("should create a user and find", function(done) {
		u.create('jack', {
			foobar: 'baz'
		}).then(function(id) {
			expect(id).not.toBe(null);
			u.get(id).then(function(result){
				expect(result).not.toBe(null);
				expect(result.name).toBe('jack');
				expect(result.user.foobar).toBe('baz');
				done();
			});
		});
	});

	it("should create a lot of users", function(done) {
		helper.createUsers( u, helper.sampleUsers ).then(function(users){
			expect(users.length).toBe( helper.sampleUsers.length );
			u.getByXML({foobar:'baz'}).then( function(result){
				expect(result).not.toBe(null);
				expect(result.length).toBe(2);
				expect(result[0].name).toBe( helper.sampleUsers[0].name );
				done();
			} );
		});
	});

	it("should query a lot of users", function(done) {
		helper.createUsers( u, helper.sampleUsers ).then(function(users){
			expect(users.length).toBe( helper.sampleUsers.length );
			u.getAll().then( function( results ){
				expect(results.length).toBe( helper.sampleUsers.length );
				done();
			} );
		});
	});
});

