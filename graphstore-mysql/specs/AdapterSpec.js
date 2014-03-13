var storage = require('../src/index.js');
var async = require('async');

describe("adapter", function() {
	var m = null;

	beforeEach(function() {
		m = new storage( 'ev' );
	});

	afterEach(function() {
		m.endTest();
	});

	it("should respond to start loading", function(done) {
		m.startLoading().then(function(){
			done();
		});
	});

	it("should create a user", function(done) {
		m.startLoading().then(function(){
			m.addUser({foo:'bar'}).then(function( id ){
				expect(id).not.toBe(null);
				done();
			});
		});
	});

	it("should create a product", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( id ){
				expect(id).not.toBe(null);
				done();
			});
		});
	});

	it("should create an affinity", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'bar'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);
						done();
					});
				});
			});
		});
	});

	it("should allow for the start of the test", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'bar'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							done();
						});
					});
				});
			});
		});
	});

	it("should run a query that finds stuff", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'baz'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							m.query({},{},'like').then(function( results ){
								expect( results.length ).toBe( 1 );
								done();
							} );
						});
					});
				});
			});
		});
	});

	it("should run a query that searches on user terms", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'baz'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							m.query({foo:'baz'},{},'like').then(function( results ){
								expect( results.length ).toBe( 1 );
								done();
							} );
						});
					});
				});
			});
		});
	});

	it("should run a query that searches on product terms", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'baz'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							m.query({},{foo:'bar'},'like').then(function( results ){
								expect( results.length ).toBe( 1 );
								done();
							} );
						});
					});
				});
			});
		});
	});

	it("should run a query that searches on user and product terms", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'baz'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							m.query({foo:'baz'},{foo:'bar'},'like').then(function( results ){
								expect( results.length ).toBe( 1 );
								done();
							} );
						});
					});
				});
			});
		});
	});

	it("should run a query that searches and finds nothing", function(done) {
		m.startLoading().then(function(){
			m.addProduct({foo:'bar'}).then(function( product_id ){
				expect(product_id).not.toBe(null);

				m.addUser({foo:'baz'}).then(function( user_id ){
					expect(user_id).not.toBe(null);

					m.addAffinity(user_id,product_id,'like').then(function( id ){
						expect(id).not.toBe(null);

						m.startTest().then(function(){
							m.query({foo:'jherr'},{foo:'bar'},'like').then(function( results ){
								expect( results.length ).toBe( 0 );
								done();
							} );
						});
					});
				});
			});
		});
	});

    it("should run a query that returns all the affinities", function(done) {
        m.startLoading().then(function() {
            async.parallel([
                function(cb) {
                    m.addProduct({foo:'bar'}).then(function(p_id) {
                        cb(null, p_id);
                    });
                },
                function(cb) {
                    m.addProduct({foo:'baz'}).then(function(p_id) {
                        cb(null, p_id);
                    });
                },
                function(cb) {
                    m.addUser({lang: 'node'}).then(function(u_id) {
                        cb(null, u_id);
                    });
                },
                function(cb) {
                    m.addUser({lang: 'java'}).then(function(u_id) {
                        cb(null, u_id);
                    });
                }
            ], function(error, result) {
                    expect(error).toBe(null);
                    result.forEach(function(e) { expect(e).not.toBe(null); } );
                    async.parallel([
                        function(cb) {
                            m.addAffinity(result[2], result[0], 'own').then(function(id) {
                                cb(null, id);
                            });
                        },
                        function(cb) {
                            m.addAffinity(result[3], result[1], 'want').then(function(id) {
                                cb(null, id);
                            });
                        }
                    ], function(error1, result1) {
                        expect(error).toBe(null);
                        result.forEach(function(e) { expect(e).not.toBe(null); } );

                        m.startTest().then(function(){
                            m.query({},{},null).then(function( results ){
                                expect( results.length ).toBe( 2 );
                                done();
                            });
                        });
                    });
            });
        });
    });
} );
