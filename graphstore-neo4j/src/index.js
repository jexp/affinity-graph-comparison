'use strict';

process.on('uncaughtException', function (err) {
    console.log("Uncaught Exception", err)
    console.log(err.stack)
});

var deferred = require('deferred'),
    async = require('async'),
    user = require('./user'),
    product = require('./product'),
    affinity = require('./affinity'),
    request = require('request');

function Neo4JStore () {
    this.uri = "http://localhost:7474/db/data/transaction/commit";
    this.user = new user(this);
    this.product = new product(this);
    this.affinity = new affinity(this);
}

Neo4JStore.prototype.cypher = function(queries,params,cb) { 
	if (!queries) return cb("No query");
	function toObjects(res) {
		if (!res || !res.body || !res.body.results) return null;
		return res.body.results.map(function(data) {
			var cols = data.columns;
			var results=data.data.map(function(row) {
				var r = {};
				for (var col=0; col < cols.length;col++) {
					r[cols[col]]=row.row[col];
				}
				return r;
			})
			return results;
		});
	}
	var statements=[];
	var single=typeof(queries) === "string";
	if (single) {
		statements.push({statement:queries,parameters:params});
	} else {
		for (var i=0;i<queries.length;i++) {
			statements.push({statement:queries[i],parameters:params[i]});
		}
	}
  	request.post({uri:this.uri,
          json:{statements:statements}},
        function(err,res) { 
			var results=toObjects(res);
	        cb(err,single ? results[0] : results);
		});
}

Neo4JStore.prototype.configurations = function () {
    return [ [ 'neo4j', new Neo4JStore() ] ];
}

Neo4JStore.prototype.addUser = function (user) {
    return this.user.create(user);
}

Neo4JStore.prototype.addProduct = function (product) {
    return this.product.create(product);
}

Neo4JStore.prototype.addAffinity = function (user_id, product_id, relation) {
    return this.affinity.create(user_id, product_id, relation);
}
Neo4JStore.prototype.addAffinities = function (affinities) {
    return this.affinity.createMany(affinities);
}

Neo4JStore.prototype.startTest = function () {
    var d = deferred();

    process.nextTick( function() { d.resolve(); } );

    return d.promise;
}

Neo4JStore.prototype.endTest = function () {
    
}

Neo4JStore.prototype.startLoading = function (loading) {
    var d = deferred();
    var that = this;
    function run(stmts) {
		if (stmts.length == 0) d.resolve(true);
		var stmt=stmts.shift();
		that.cypher(stmt, {}, function (e, result) {
	        if (e)
	            d.reject(new Error('Unable to run query '+stmt+' due to: ' + JSON.stringify(e)));
	        else 
				run(stmts);
		});
	}

    var stmts=['MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE r;', 'MATCH (n) DELETE n;',
               'CREATE INDEX ON :User(id);','CREATE INDEX ON :Product(id);','CREATE INDEX ON :User(hair);'];
	if (loading) run(stmts); else d.resolve(true);
    return d.promise;
}

Neo4JStore.prototype.query = function ( user_terms, product_terms, relation ) {
    return this.affinity.getByQuery(user_terms, product_terms, relation);
}

module.exports = Neo4JStore;