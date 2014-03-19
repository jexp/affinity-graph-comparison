var Model = require('./model'),
    deferred = require('deferred');
    _ = require('lodash');

function Affinity(client) {
    Model.call(this, client, 'Affinity');
}

Affinity.prototype = Object.create(Model.prototype);

Affinity.prototype.constructor = Affinity;

Affinity.prototype.createQuery = function(relation) {
	return "MATCH (u:User),(p:Product) \
                WHERE u.id = {user_id} AND p.id = {product_id} \
                CREATE (u)-[r:" + relation.toUpperCase() + " { id: " + this.nextId++ + "} ]->(p) \
                RETURN r";	
}

Affinity.prototype.create = function(user_id, product_id, relation) {
    var d = deferred();

    var label = this.label,
        statement = this.createQuery(relation);

    this.client.cypher(statement, {user_id: user_id, product_id: product_id }, function(e, result) {
        if (e) 
            d.reject(new Error('Unable to create ' + label + ' due to: ' + JSON.stringify(e)));
		else
        	d.resolve(result[0].r.id);
    });

    return d.promise;
}

Affinity.prototype.createMany = function(affinities) {
    var d = deferred();

	var that = this;
    var label = this.label,
        statements = affinities.map(function(a) { return that.createQuery(a.relation) });
        params = affinities.map(function(a) { return {user_id: a.user_id, product_id: a.product_id }});
    this.client.cypher(statements, params /*could be affinities*/, function(e, results) {
		var data=results.map(function(r) { return r[0].r.id; });
        if (e) 
            d.reject(new Error('Unable to create ' + label + ' due to: ' + JSON.stringify(e)));
		else
        	d.resolve(data);
    });

    return d.promise;
}


Affinity.prototype.getByQuery = function (user_terms, product_terms, relation) {
    var d = deferred();

    if(relation)
        relation = ':' + relation.toUpperCase();
    else
        relation = '';

    var label = this.label,
        queryTerms = this._combineTerms(user_terms, product_terms),
        where = 'WHERE ' + this._createWhereClause(user_terms, product_terms) + ' ',
        statement = 'MATCH (u:User)-[r' + relation + ']->(p:Product) ' +
                    (where === 'WHERE  ' ? '' : where) + 
                    'RETURN r ORDER BY r.id LIMIT 100;';

    this.client.cypher(statement, queryTerms, function (e, result) {
        if (e) 
            d.reject(new Error('Unable to ' + label + ' get by query due to: ' + JSON.stringify(e)));

        d.resolve(result);
    });

    return d.promise;
}

Affinity.prototype._combineTerms = function(user_terms, product_terms) {
    var result = {};

    _.forIn(user_terms, function(value, key) {
        result['u_'+key] = value;
    });

    _.forIn(product_terms, function(value, key) {
        result['p_'+key] = value;
    });

    return result;
}

Affinity.prototype._createWhereClause = function(user_terms, product_terms) {
    var clauses = [];

    _.forIn(user_terms, function(value, key) {
       clauses.push('u.' + key + ' = {u_' + key + '}');
    });

    _.forIn(product_terms, function(value, key) {
       clauses.push('p.' + key + ' = {p_' + key + '}');
    });

    return clauses.join(' AND ');
}

module.exports = Affinity;
