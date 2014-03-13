var deferred = require('deferred');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function IndexCreator(client) {
    this.client = client;
    this.createIndex = __bind(this.createIndex, this);
    this.deleteIndex = __bind(this.deleteIndex, this);
    this.doesIndexExist = __bind(this.doesIndexExist, this);
    this.resetIndex = __bind(this.resetIndex, this);
}

IndexCreator.prototype.resetIndex = function (indexName, type) {
    var d = deferred();

    var createIndex = this.createIndex,
        deleteIndex = this.deleteIndex;

    this.doesIndexExist(indexName).then(function(exists) {
        if(exists) {
            deleteIndex(indexName).then(function(body) {
                return createIndex(indexName, type);
            }).done(function(body) { d.resolve(true); },
                function(error) {
                    d.reject(error);
                }
            );
        } else {
            createIndex(indexName, type).then(function(body) { d.resolve(true); }, function(error) {
                d.reject(error);
            });
        }
    }, function (error) {
        d.reject(error);
    });

    return d.promise;
}

IndexCreator.prototype.createIndex = function (indexName, type) {
    var d = deferred();

    var params = {
        index: indexName,
        body: {
            "mappings" : {
                
            }
        }
    };

    params.body.mappings[type] = {
        "_id" : {
            "path" : "id"
        }
    };

    this.client.indices.create(params).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to create user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

IndexCreator.prototype.doesIndexExist = function (indexName) {
    var d = deferred();

    this.client.indices.exists( { index:indexName } ).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to check existence of user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

IndexCreator.prototype.deleteIndex = function (indexName) {
    var d = deferred();

    this.client.indices.delete( { index:indexName } ).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to delete user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

module.exports = IndexCreator;
