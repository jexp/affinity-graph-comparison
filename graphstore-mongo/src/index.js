var async = require('async'),
	deferred = require('deferred');

function MongoStore() {
	this.db = null;
	this.client = require('mongodb').MongoClient;
	this.index = 0;
}

MongoStore.prototype._connect = function() {
	var def = deferred();

	var self = this;
	if ( this.db == null ) {
		this.client.connect('mongodb://localhost:27017/affinity', function(err, db) {
			if ( err ) throw err;
			self.db = db;
			def.resolve( db );
		});
	} else {
		process.nextTick( function() { def.resolve( self.db ); } );
	}

	return def.promise;
}

MongoStore.prototype.endTest = function() {
	this.db.close();
}

MongoStore.prototype.configurations = function() {
	return [ [ 'Mongo', new MongoStore() ] ];
}

MongoStore.prototype.addUser = function( user ) {
	var def = deferred();
	this.users.insert( user, function( err, result ) {
		if ( err ) throw err;
	 	def.resolve( result[0]._id );
	} );
	return def.promise;
}

MongoStore.prototype.addProduct = function( product ) {
	var def = deferred();
	this.products.insert( product, function( err, result ) {
		if ( err ) throw err;
		def.resolve( result[0]._id );
	} );
	return def.promise;
}

MongoStore.prototype.addAffinity = function( user_id, product_id, relation ) {
	var def = deferred();
	var self = this;
	self.products.findOne( { _id: product_id }, function( err, product ) {
		if ( err ) throw err;
		self.users.findOne( { _id: user_id }, function( err, user ) {
			if ( err ) throw err;
			self.index += 1;
			self.affinity.insert( {
			 	relation: relation,
			 	user_id: user_id,
			 	user: user,
			 	index: self.index,
			 	product_id: product_id,
			 	product: product
			}, function( err, result ) {
				if ( err ) throw err;
			 	def.resolve( result._id );
			} );
		} );
	} );
	return def.promise;
}

MongoStore.prototype.startTest = function( ) {
	var def = deferred();
	process.nextTick( function() { def.resolve(); } );
	return def.promise;
}

MongoStore.prototype.startLoading = function( clean ) {
	var def = deferred();

	var self = this;
	this._connect().then( function() {
		if ( clean === undefined || clean == true ) {
			async.each( [ 'users', 'products', 'affinity' ], function( name, callback ) {
				self.db.dropCollection( name, function( err, result ) {
					if ( err ) throw err;
					callback( null );
				} )
			}, function() {
				async.each( [ 'users', 'products', 'affinity' ], function( name, callback ) {
					self.db.createCollection( name, function( err, result ) {
						if ( err ) throw err;
						self[name] = result;
						callback( null );
					} )
				}, function() {
					def.resolve();
				} );
			} );
		} else {
			def.resolve();
		}
	} );

	return def.promise;
}

MongoStore.prototype.query = function( user_terms, product_terms, relation ) {
	var def = deferred();

	var query = {};
	if ( relation != null ) { relation: relation };
	for( var k in user_terms ) { query["user."+k] = user_terms[k]; }
	for( var k in product_terms ) { query["product."+k] = product_terms[k]; }

	this.affinity.find( query, {count:100,'sort':{'index':1}} ).toArray( function( err, result ) {
		if ( err ) throw err;
	 	def.resolve( result );
	} );

	return def.promise;
}

module.exports = MongoStore;
