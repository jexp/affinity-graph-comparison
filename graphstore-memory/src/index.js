var deferred = require('deferred'),
	_ = require('underscore');

function MemoryStore() {
	this.last_product_id = 1;
	this.products = {};

	this.last_user_id = 1;
	this.users = {};

	this.last_affinity_id = 1;
	this.affinity = {};
}

MemoryStore.prototype.endTest = function() {
}

MemoryStore.prototype.configurations = function() {
	return [ [ 'Memory', new MemoryStore() ] ];
}

MemoryStore.prototype.addUser = function( user ) {
    var def = deferred();

	var id = this.last_user_id;
	this.last_user_id++;
	this.users[ id ] = user;

	process.nextTick( function() { def.resolve( id ); } );

	return def.promise;
}

MemoryStore.prototype.getUser = function( id ) {
    var def = deferred();

    var self = this;
	process.nextTick( function() { def.resolve( self.users[ id ] ); } );

	return def.promise;
}

MemoryStore.prototype.deleteUser = function( id ) {
    var def = deferred();

    delete this.users[ id ];

	process.nextTick( function() { def.resolve(); } );

	return def.promise;
}

MemoryStore.prototype.updateUser = function( id, user ) {
    var def = deferred();

    this.users[ id ] = user;

	process.nextTick( function() { def.resolve( user ); } );

	return def.promise;
}

MemoryStore.prototype.getUsers = function() {
    var def = deferred();

    var self = this;
	process.nextTick( function() { def.resolve( _.values( self.users ) ); } );

	return def.promise;
}

MemoryStore.prototype.addProduct = function( product ) {
    var def = deferred();

	var id = this.last_product_id;
	this.last_product_id++;
	this.products[ id ] = product;

	process.nextTick( function() { def.resolve( id ); } );

	return def.promise;
}

MemoryStore.prototype.updateProduct = function( id, product ) {
    var def = deferred();

	this.products[ id ] = product;

	process.nextTick( function() { def.resolve( product ); } );

	return def.promise;
}

MemoryStore.prototype.deleteProduct = function( id ) {
    var def = deferred();

	delete this.products[ id ];

	process.nextTick( function() { def.resolve(); } );

	return def.promise;
}

MemoryStore.prototype.getProduct = function( id ) {
    var def = deferred();

    var self = this;
	process.nextTick( function() { def.resolve( self.products[ id ] ); } );

	return def.promise;
}

MemoryStore.prototype.getProducts = function() {
    var def = deferred();

    var self = this;
	process.nextTick( function() { def.resolve( _.values( self.products ) ); } );

	return def.promise;
}

MemoryStore.prototype.addAffinity = function( user_id, product_id, relation ) {
    var def = deferred();

	if ( this.affinity[ relation ] == null ) {
		this.affinity[ relation ] = [];
	}

	var id = this.last_affinity_id;
	this.last_affinity_id++;

	this.affinity[ relation ].push( {
		user: this.users[ user_id ],
		product: this.products[ product_id ],
		relation: relation,
		user_id: user_id,
		product_id: product_id,
		id: id
	} );

	process.nextTick( function() { def.resolve( id ); } );

	return def.promise;
}

MemoryStore.prototype.getAffinities = function( ) {
    var def = deferred();

    var self = this;
    var complete = [];
    for( var k in self.affinity ) {
    	complete.push( _.values( self.affinity[ k ] ) );
    }
    complete = _.flatten( complete );
	process.nextTick( function() { def.resolve( complete ); } );

	return def.promise;
}

MemoryStore.prototype.deleteAffinity = function( user_id, product_id, relation ) {
    var def = deferred();

    var self = this;
    for( var k in self.affinity ) {
    	for( var a in self.affinity[ k ] ) {
    		var aff = self.affinity[ k ][ a ];
    		if ( aff.user_id == user_id &&
    			aff.product_id == product_id &&
    			aff.relation == relation ) {
    			delete self.affinity[ k ][ a ];
    			break;
    		}
    	}
    }
	process.nextTick( function() { def.resolve( ); } );

	return def.promise;
}

MemoryStore.prototype.startTest = function( ) {
    var def = deferred();

	process.nextTick( function() { def.resolve(); } );

	return def.promise;
}

MemoryStore.prototype.startLoading = function( clean ) {
    var def = deferred();

	process.nextTick( function() { def.resolve(); } );

	return def.promise;
}

MemoryStore.prototype.query = function( user_terms, product_terms, relation ) {
    var def = deferred();

	var results = [];
	if ( relation != null ) {
		this._checkAffinity( this.affinity[ relation ], user_terms, product_terms, results );
	} else {
		for( var relation in this.affinity )
			this._checkAffinity( this.affinity[ relation ], user_terms, product_terms, results );
	}

	process.nextTick( function() { def.resolve( results ); } );

	return def.promise;
}

MemoryStore.prototype._checkAffinity = function( affinities, user_terms, product_terms, results ) {
	for( var i in affinities ) {
		var aff = affinities[ i ];
		if ( this._checkTerms( user_terms, aff.user ) && this._checkTerms( product_terms, aff.product ) )
			results.push( aff );
	}
}

MemoryStore.prototype._checkTerms = function( terms, data ) {
	for ( var k in terms ) {
		if( data[k] != terms[k] )
			return false;
	}
	return true;
}

module.exports = MemoryStore;
