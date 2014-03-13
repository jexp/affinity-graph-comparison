var mysql = require('mysql'),
	product = require('../src/product.js'),
	user = require('../src/user.js'),
	affinity = require('../src/affinity.js'),
	helper = require('./helper.js');

describe("affinity", function() {
	var client = null, p = null, u = null;

	beforeEach(function() {
		client = mysql.createConnection({host: 'localhost', user: 'root',password: '',database: 'affinity'});
		client.connect();

		p = new product(client);
		u = new user(client);
		a = new affinity(client);

		var done = false;
		helper.clean(client).then(function() { done = true; });
		waitsFor(function() { return done; });
	});

	afterEach(function(){
		client.end();
	});

	it("should store affinities", function(done) {
		helper.createProducts( p, helper.sampleProducts ).then(function(products){
			expect(products.length).toBe( helper.sampleProducts.length );

			helper.createUsers( u, helper.sampleUsers ).then(function(users){
				expect(users.length).toBe( helper.sampleUsers.length );

				a.create( users[0].id, products[0].id, "like" ).then( function( result ) {
					a.getByUser( users[0].id ).then( function( result ) {
						expect(result.length).toBe(1);
						done();
					} );
				} );
			});
		});
	});

	it("should query lots affinities", function(done) {
		helper.createProducts( p, helper.sampleProducts ).then(function(products){
			expect(products.length).toBe( helper.sampleProducts.length );

			helper.createUsers( u, helper.sampleUsers ).then(function(users){
				expect(users.length).toBe( helper.sampleUsers.length );

				a.create( users[0].id, products[0].id, "like" ).then( function( result ) {
					a.getAll().then( function( results ) {
						expect( results.length ).toBe( 1 );
						done();
					} );
				} );
			});
		});
	});
});