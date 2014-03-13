var async = require('async'),
	deferred = require('deferred'),
	xml2js = require('xml2js');

function Product( client ) {
	this.client = client;
}

var parser = new xml2js.Parser({explicitArray:false});

Product.prototype.parseData = function( data ) {
	var def = deferred();
	parser.parseString(data, function (err, result) {
		def.resolve( result.info );
	} );
	return def.promise;
}

Product.prototype.unpackList = function( products ) {
	var def = deferred();
	var self = this;
	async.each( products, function( item, callback ) {
		self.parseData( item.data ).then( function( product ) {
			item.product = product;
			callback( null, null );
		} );
	}, function( err ) {
		def.resolve();
	} );
	return def.promise;
}

Product.prototype.create = function( uuid, url, name, values ) {
	var def = deferred();

	var self = this;
	var id = null;

	async.series( [
		function( callback ) {
			var xmldoc = '<info>';
			for( k in values ) {
				xmldoc += '<'+k+'>'+values[k]+'</'+k+'>';
			}
			xmldoc += '</info>';
			self.client.query('INSERT INTO product VALUES (0,?,?,?,?)', [ uuid, url, name, xmldoc ], function(err, result) {
				callback(null);
			} );
		},
		function( callback ) {
			self.client.query('SELECT id FROM product WHERE uuid=?', [ uuid ], function(err, result) {
				id = result[0].id;
				callback(null,result[0].id);
			} );
		},
		function( callback ) {
			var data = [];
			for( k in values ) {
				data.push( { key: k, value: values[ k ] } );
			}
			async.each( data, function( item, scb ) {
				self.client.query('INSERT INTO product_kv VALUES (0,?,?,?,?)', [id,item.key,item.value,0], function(err, result) {
					scb(null,null);
				} );
			}, function( err ) {
				callback(null,null);
			} );
		}
	],
	function( err, result ) {
		def.resolve( result[1] );
	} );

	return def.promise;
}

Product.prototype.get = function( id ) {
	var def = deferred();
	var self = this;

	this.client.query("SELECT * FROM product WHERE id=?", [id], function(err, result) {
		self.parseData( result[0].data ).then( function( product ) {
			result[0].product = product;
			def.resolve( result[0] );
		} );
	} );

	return def.promise;
};

Product.prototype.getAll = function() {
	var def = deferred();

	var self = this;
	this.client.query( 'SELECT * FROM product', [], function(err, result) {
		self.unpackList( result ).then( function() {
			def.resolve(result);
		});
	} );

	return def.promise;
};

Product.prototype.getByXML = function( terms ) {
	var def = deferred();

	var params = [];
	var sql = 'SELECT * FROM product WHERE';
	var first = true;
	for( var k in terms ) {
		if ( first == false ) sql += ' AND ';
		sql += ' EXTRACTVALUE( data, ? ) LIKE ?';
		params.push( '/info/'+k );
		params.push( '%'+terms[k]+'%' );
		first = false;
	}

	var self = this;
	this.client.query( sql, params, function(err, result) {
		self.unpackList( result ).then( function() {
			def.resolve(result);
		});
	} );

	return def.promise;
};

Product.prototype.getByEVMap = function( terms ) {
	var def = deferred();

	var sql = "select product.*, count(*) as _count from product_kv,product WHERE product_kv.product_id = product.id AND ( ";
	var first = true;
	var target = 0;
	var params = [];
	for( var k in terms ) {
		if ( first == false ) sql += ' OR ';
		sql += " ( product_kv.name=? AND product_kv.svalue LIKE ? ) ";
		params.push( k );
		params.push( '%'+terms[k]+'%' );
		first = false;
		target += 1;
	}
	sql += ") GROUP BY product.id";

	var self = this;
	this.client.query( sql, params, function(err, result) {
		var out = [];
		for( var row in result ) {
			if ( result[row]._count == target ) {
 				delete result[row]._count;
				out.push( result[row] );
			}
		}
		self.unpackList( out ).then( function() {
			def.resolve( out );
		});
	} );

	return def.promise;
}

module.exports = Product;