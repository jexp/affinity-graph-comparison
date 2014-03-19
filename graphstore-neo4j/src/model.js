var deferred = require('deferred'),
    _ = require('lodash');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function Model(client, label) {
    this.client = client;
    this.create = __bind(this.create, this);
    this.getByQuery = __bind(this.getByQuery, this);
    this.label = label;
    this.nextId = 1;
}

Model.prototype.create = function (obj) {
    var d = deferred();
    if(!obj.hasOwnProperty('id'))
        obj.id = this.nextId++;

    var label = this.label,
        stmt = 'CREATE (n:' + label + ' { obj } ) RETURN n.id as id;';

    this.client.cypher(stmt, {obj: obj}, function (e, result) {
        if (e) 
            d.reject(new Error('Unable to create ' + label + ' due to: ' + JSON.stringify(e)));
        d.resolve(result[0].id);
    });

    return d.promise;
}

Model.prototype.getByQuery = function (query) {
    var d = deferred();

    var label = this.label,
        statement = 'MATCH (n:' + label + ') WHERE ' + this._createWhereClause(query) + ' RETURN n;';

    this.client.cypher(statement, query, function (e, result) {
        if (e) 
            d.reject(new Error('Unable to ' + label + ' get by query due to: ' + JSON.stringify(e)));
        d.resolve(result);
    });

    return d.promise;
}

Model.prototype._createWhereClause = function (query) {
    var clauses = [];

    _.forIn(query, function(value, key) {
        clauses.push('n.' + key + ' = {' + key + '}');
    });

    return clauses.join(' AND ');
}

module.exports = Model;
