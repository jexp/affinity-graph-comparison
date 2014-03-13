var deferred = require('deferred'),
	mysql = require('mysql'),
	user = require('./user.js'),
	affinity = require('./affinity.js'),
	etl = require('./etl.js'),
	product = require('./product.js'),
	query = require('./query.js'),
	utils = require('./utils.js');

function MYSQLStore( mode ) {
	this.mode = mode;

	this.last_product_id = 1;
	this.last_user_id = 1;
	this.last_affinity_id = 1;
}

MYSQLStore.prototype.endTest = function() {
	this.client.end();
}

MYSQLStore.prototype.configurations = function() {
	return [ [ 'MySQL - XML', new MYSQLStore( 'xml' ) ],
			 [ 'MySQL - EV', new MYSQLStore( 'ev' ) ],
			 [ 'MySQL - ETL', new MYSQLStore( 'etl' ) ] ];
}

MYSQLStore.prototype.addUser = function( user ) {
	var id = this.last_user_id;
	this.last_user_id++;

	return this.u.create('user'+id, user);
}

MYSQLStore.prototype.addProduct = function( product ) {
	var id = this.last_product_id;
	this.last_product_id++;

	return this.p.create('uu'+id,'http://foobar.com/'+id,'product'+id, product);
}

MYSQLStore.prototype.addAffinity = function( user_id, product_id, relation ) {
	return this.a.create( user_id, product_id, relation );
}

MYSQLStore.prototype.startTest = function( ) {
	if ( this.mode == 'etl' ) {
		return this.e.synchronize();
	} else {
	    var def = deferred();
		process.nextTick( function() { def.resolve(); } );
		return def.promise;
	}
}

MYSQLStore.prototype.startLoading = function( clean ) {
	this.client = mysql.createConnection({host: 'localhost',user: 'root',password: '',database: 'affinity'});
	this.client.connect();

	this.u = new user(this.client);
	this.a = new affinity(this.client);
	this.e = new etl(this.client);
	this.p = new product(this.client);
	this.q = new query(this.client);

	if ( clean === undefined || clean == true ) {
		return utils.clean( this.client );
	} else {
	    var def = deferred();
		process.nextTick( function() { def.resolve(); } );
		return def.promise;
	}
}

MYSQLStore.prototype.query = function( user_terms, product_terms, relation ) {
	if ( this.mode == 'xml' ) {
		return this.q.byXML( relation, user_terms, product_terms );
	} else if ( this.mode == 'ev' ) {
		return this.q.byEV( relation, user_terms, product_terms );
	} else {
		return this.e.query( relation, user_terms, product_terms );
	}
}

module.exports = MYSQLStore;
