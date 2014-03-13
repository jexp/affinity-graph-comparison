var deferred = require('deferred');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function Affinity(client, user, product) {
    this.client = client;
    this.user = user;
    this.product = product;
    this.create = __bind(this.create, this);
    this.getById = __bind(this.getById, this);
    this.getByQuery = __bind(this.getByQuery, this);
    this.createIndex = __bind(this.createIndex, this);
    this.deleteIndex = __bind(this.deleteIndex, this);
    this.doesIndexExist = __bind(this.doesIndexExist, this);
    this.resetIndex = __bind(this.resetIndex, this);
    this.nextId = 1;
}

Affinity.prototype.create = function (user_id, product_id, relation) {
    var d = deferred();

    var affinity = {};

    affinity.id = this.nextId++;
    affinity.relation = relation;

    var client = this.client;
        product = this.product;

    this.user.getById(user_id).then(function(user) {
        affinity['_user'] = user._source;
        product.getById(product_id).then(function(product) {
            affinity['_product'] = product._source;
            client.create({
                index: 'affinity',
                type: 'affinity',
                body: affinity
            }).then(function(body) {
                d.resolve(body['_id']);
            }, function(e3) {
                d.reject(new Error('Unable to create affinity. Error: ' + JSON.stringify(error)));
            });
        }, function(e2) {
            d.reject(new Error('Unable to find product to create affinity. Error: ' + JSON.stringify(error)));
        });
    }, function(e) {
        d.reject(new Error('Unable to find user to create affinity. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

Affinity.prototype.getById = function (id) {
    var d = deferred();

    this.client.get({
        index: 'affinity',
        type: 'affinity',
        id: id
    }).then(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to getById of id: ' + id +'. Error: ' + JSON.stringify(error)));
    }
    );

    return d.promise;
}

Affinity.prototype.getByQuery = function (query) {
    var d = deferred();

    this.client.search({
        index: "affinity",
        size: 100,
        sort: "id",
        body: {
            filter: {
                bool : {
                    must: query
                }
            }
        }
    }).then(function(body) {
        d.resolve(body.hits.hits);
    }, function(error) {
        d.reject(new Error('Unable to getByQuery of id: ' + query +'. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

Affinity.prototype.createIndex = function () {
    var d = deferred();

    this.client.indices.create({
        index: 'affinity',
        body: {
            "mappings" : {
                "affinity" : {
                    "_id" : {
                        "path" : "id"
                    }
                }
            }
        }
    }).then(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to create affinity index. Error: ' + JSON.stringify(error)));
    }
    );

    return d.promise;
}

Affinity.prototype.deleteIndex = function () {
    var d = deferred();

    this.client.indices.delete({index:'affinity'}).then(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to delete affinity index. Error: ' + JSON.stringify(error)));
    }
    );

    return d.promise;
}

Affinity.prototype.doesIndexExist = function () {
    var d = deferred();

    this.client.indices.exists({index:'affinity'}).then(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to check existence of affinity index. Error: ' + JSON.stringify(error)));
    }
    );

    return d.promise;
}

Affinity.prototype.resetIndex = function () {
    var d = deferred();

    var createIndex = this.createIndex,
        deleteIndex = this.deleteIndex;

    this.doesIndexExist().then(function(exists) {
        if(exists) {
            deleteIndex().then(function(body) {
                return createIndex();
            }).done(function(body) { d.resolve(true); },
                function(error) {
                    d.reject(error);
                }
            );
        } else {
            createIndex().then(function(body) { d.resolve(true); }, function(error) {
                d.reject(error);
            });
        }
    }, function (error) {
        d.reject(error);
    });

    return d.promise;
}


Affinity.prototype.refresh = function () {
    var d = deferred();

    this.client.indices.refresh({
        index: "affinity"
    }, function (err, body) {
        if(err != null)
            d.reject( new Error("Unable to refresh affinity index due to: " + err) );
        else
            d.resolve(true);
    });

    return d.promise;
}

module.exports = Affinity;
