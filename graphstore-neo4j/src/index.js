'use strict';

var deferred = require('deferred'),
    async = require('async'),
    user = require('./user'),
    product = require('./product'),
    affinity = require('./affinity'),
    neo4j = require('neo4j');

function Neo4JStore () {
    this.client = new neo4j.GraphDatabase('http://localhost:7474');
    this.user = new user(this.client);
    this.product = new product(this.client);
    this.affinity = new affinity(this.client);
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

Neo4JStore.prototype.startTest = function () {
    var d = deferred();

    process.nextTick( function() { d.resolve(); } );

    return d.promise;
}

Neo4JStore.prototype.endTest = function () {
    
}

Neo4JStore.prototype.startLoading = function () {
    var d = deferred();

    var client = this.client;
    var stmt = 'MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE r;';
    var stmt2 = 'MATCH (n) DELETE n;';

    this.client.query(stmt, {}, function (e, result) {
        if(e)
            d.reject('Unable to clear database due to: ' + JSON.stringify(e));
        else {
            client.query(stmt2, {}, function(e2, result2) {
                if(e2)
                    d.reject(new Error('Unable to clear database due to: ' + JSON.stringify(e)));
                else
                    d.resolve(true);
            });
        }
    });

    return d.promise;
}

Neo4JStore.prototype.query = function ( user_terms, product_terms, relation ) {
    return this.affinity.getByQuery(user_terms, product_terms, relation);
}

module.exports = Neo4JStore;