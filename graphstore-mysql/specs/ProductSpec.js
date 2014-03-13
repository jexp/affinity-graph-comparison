var mysql = require('mysql'),
	product = require('../src/product.js'),
	helper = require('./helper.js');

describe("product", function() {
	var client = null, p = null;

	beforeEach(function() {
		client = mysql.createConnection({host: 'localhost', user: 'root',password: '',database: 'affinity'});
		client.connect();

		p = new product(client);

		var done = false;
		helper.clean(client).then(function() { done = true; });
		waitsFor(function() { return done; });
	});

	afterEach(function(){
		client.end();
	});

	it("should create a product", function(done) {
		p.create('uu1','http://foobar.com','bray', {
			foobar: 'baz'
		}).then(function(id) {
			expect(id).not.toBe(null);
			done();
		});
	});

	it("should create a product and find", function(done) {
		p.create('uu1','http://foobar.com','bray', {
			foobar: 'baz'
		}).then(function(id) {
			expect(id).not.toBe(null);
			p.get(id).then(function(result){
				expect(result).not.toBe(null);
				expect(result.name).toBe('bray');
				done();
			});
		});
	});

	it("should create a lot of products", function(done) {
		helper.createProducts( p, helper.sampleProducts ).then(function(products){
			expect(products.length).toBe( helper.sampleProducts.length );
			p.getByXML({foobar:'baz'}).then( function(result){
				expect(result).not.toBe(null);
				expect(result.length).toBe(2);
				expect(result[0].name).toBe(helper.sampleProducts[0].name);
				expect(result[0].product.foobar).toBe('baz');
				done();
			} );
		});
	});

	it("should query all of a lot of products", function(done) {
		helper.createProducts( p, helper.sampleProducts ).then(function(products){
			expect(products.length).toBe( helper.sampleProducts.length );
			p.getAll().then( function(results){
				expect(results.length).toBe( helper.sampleProducts.length );
				done();
			} );
		});
	});
});