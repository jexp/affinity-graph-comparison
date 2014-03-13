var async = require('async'),
	deferred = require('deferred'),
	xml2js = require('xml2js');

function User( client ) {
	this.client = client;
}

var parser = new xml2js.Parser({explicitArray:false});

User.prototype.parseData = function( data ) {
	var def = deferred();
	parser.parseString(data, function (err, result) {
		def.resolve( result.info );
	} );
	return def.promise;
}

User.prototype.unpackList = function( users ) {
	var def = deferred();
	var self = this;
	async.each( users, function( item, callback ) {
		self.parseData( item.data ).then( function( user ) {
			item.user = user;
			callback( null, null );
		} );
	}, function( err ) {
		def.resolve();
	} );
	return def.promise;
}

User.prototype.create = function( name, values ) {
	var def = deferred();

	var id = null;
	var self = this;
	async.series( [
		function( callback ) {
			var xmldoc = '<info>';
			for( k in values ) {
				xmldoc += '<'+k+'>'+values[k]+'</'+k+'>';
			}
			xmldoc += '</info>';
			self.client.query('INSERT INTO user VALUES (0,?,?)', [ name, xmldoc], function(err, res) {
				self.client.query('SELECT id FROM user WHERE name=?', [ name ], function(err, result) {
					id = result[0].id;
					callback(null,result[0].id);
				} );
			} );
		},
		function( callback ) {
			var data = [];
			for( k in values ) {
				data.push( { key: k, value: values[ k ] } );
			}
			async.each( data, function( item, scb ) {
				self.client.query('INSERT INTO user_kv VALUES (0,?,?,?,?)', [id,item.key,item.value,0], function(err, result) {
					scb(null,null);
				} );
			}, function( err ) {
				callback(null,null);
			} );
		}
	],
	function( err, result ) {
		def.resolve( id );
	} );

	return def.promise;
}

User.prototype.get = function( id ) {
	var def = deferred();
	var self = this;

	this.client.query("SELECT * FROM USER WHERE id=?", [id], function(err, result) {
		self.parseData( result[0].data ).then( function( user ) {
		 	result[0].user = user;
			def.resolve( result[0] );
		} );
	} );

	return def.promise;
};

User.prototype.getAll = function( ) {
	var def = deferred();

	var self = this;
	this.client.query( 'SELECT * FROM user', [], function(err, result) {
		self.unpackList( result ).then( function() {
			def.resolve( result );
		} );
	} );

	return def.promise;
};

User.prototype.getByXML = function( terms ) {
	var def = deferred();

	var params = [];
	var sql = 'SELECT * FROM USER WHERE';
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
			def.resolve( result );
		} );
	} );

	return def.promise;
};

User.prototype.getByEVMap = function( terms ) {
	var def = deferred();

	var sql = "select user.*, count(*) as _count from user_kv,user WHERE user_kv.user_id = user.id AND ( ";
	var first = true;
	var target = 0;
	var params = [];
	for( var k in terms ) {
		if ( first == false ) sql += ' OR ';
		sql += " ( user_kv.name=? AND user_kv.svalue LIKE ? ) ";
		params.push( k );
		params.push( '%'+terms[k]+'%' );
		first = false;
		target += 1;
	}
	sql += ") GROUP BY user.id";

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
			def.resolve(out);
		} );
	} );

	return def.promise;
}
module.exports = User;