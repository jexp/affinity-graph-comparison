var async = require('async'),
	deferred = require('deferred'),
	xml2js = require('xml2js');

function Query( client ) {
	this.client = client;
}

var parser = new xml2js.Parser({explicitArray:false});

Query.prototype.parseData = function( data ) {
	var def = deferred();
	parser.parseString(data, function (err, result) {
		def.resolve( result.info );
	} );
	return def.promise;
}

Query.prototype.unpackRows = function( rows ) {
	var def = deferred();
	var self = this;
	async.each( rows, function( item, callback ) {
		self.parseData( item.user_data ).then( function( user ) {
			item.user = user;
			delete item.user_data;
			self.parseData( item.product_data ).then( function( product ) {
				item.product = product;
				delete item.product_data;
				callback( null, null );
			} );
		} );
	}, function( err ) {
		def.resolve();
	} );
	return def.promise;
}

Query.prototype.byEV = function( relation, user_terms, product_terms ) {
	var def = deferred();

	var params = [];
	var rel_sql = '';
	if ( relation != null ) {
		rel_sql = ' a.relation=? AND '
		params.push( relation );
	}
	var sql = 'SELECT a.product_id, a.user_id, a.relation, u.data as user_data, p.data as product_data FROM affinity a, user u, user_kv ukv, product p, product_kv pkv WHERE '+rel_sql+' a.user_id = u.id AND ukv.user_id = u.id';

	var tchecks = [];
	for( var k in user_terms ) {
		tchecks.push( ' ukv.name = ? AND ukv.svalue LIKE ? ' );
		params.push( k );
		params.push( '%'+user_terms[k]+'%' );
	}
	if ( tchecks.length > 0 ) {
		sql += ' AND ( '+tchecks.join(' AND ')+' ) ';
	}

sql += ' AND a.product_id = p.id AND pkv.product_id = p.id ';

	var tchecks = [];
	for( var k in product_terms ) {
		tchecks.push( ' pkv.name = ? AND pkv.svalue LIKE ? ' );
		params.push( k );
		params.push( '%'+product_terms[k]+'%' );
	}
	if( tchecks.length > 0 ) {
		sql += 'AND ( ' + tchecks.join(' AND ') + ' ) ';
	}

sql += ' GROUP BY user_id, product_id ORDER BY user_id LIMIT 100';

	var self = this;
	this.client.query( sql, params, function(err, result) {
		self.unpackRows( result ).then( function() {
			def.resolve(result);
		});
	} );

	return def.promise;
}


Query.prototype.byXML = function( relation, user_terms, product_terms ) {
	var def = deferred();

	var params = [];
	var rel_sql = '';
	if ( relation != null ) {
		rel_sql = ' a.relation=? AND '
		params.push( relation );
	}
	var sql = 'SELECT a.product_id, a.user_id, a.relation, u.data as user_data, p.data as product_data FROM affinity a, user u, product p WHERE '+rel_sql+' a.user_id = u.id ';

	for( var k in user_terms ) {
		sql += ' AND EXTRACTVALUE( u.data, ? ) LIKE ? ';
		params.push( '/info/'+k );
		params.push( '%'+user_terms[k]+'%' );
	}

sql += ' AND a.product_id = p.id ';

	for( var k in product_terms ) {
		sql += ' AND EXTRACTVALUE( p.data, ? ) LIKE ? ';
		params.push( '/info/'+k );
		params.push( '%'+product_terms[k]+'%' );
	}

sql += ' GROUP BY user_id, product_id ORDER BY user_id LIMIT 100';

	var self = this;
	this.client.query( sql, params, function(err, result) {
		self.unpackRows( result ).then( function() {
			def.resolve(result);
		});
	} );

	return def.promise;
}

module.exports = Query;
