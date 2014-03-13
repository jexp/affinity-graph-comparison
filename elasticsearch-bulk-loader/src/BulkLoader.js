var deferred = require('deferred');
var _ = require('lodash');
var async = require('async');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function BulkLoader(client, index, type) {
    this.client = client;
    this.index = index;
    this.type = type;
    this.disableIndexRefresh = __bind(this.disableIndexRefresh, this);
    this.enableIndexRefresh = __bind(this.enableIndexRefresh, this);
    this.bulkIndex = __bind(this.bulkIndex, this);
    this.getById = __bind(this.getById, this);
    this.nextId = 1;
}

BulkLoader.prototype.getUserAndProduct = function(documents) {
    var d = deferred();

    var getById = this.getById;

    var result = [];

    async.each(documents, function(doc, cb) {
        var userId = doc.user_id;
        var productId = doc.product_id;
        var affinity = { relation: doc.relation };

        getById(userId, 'users', 'user').then(function(user) {
            affinity['_user'] = user._source;
            getById(productId, 'products', 'product').then(function(product) {
                affinity['_product'] = product._source;
                result.push(affinity);
                cb();
            }, function(e2) {
                cb(e2);
            });
        }, function(e1) {
            cb(e1);
        });
    }, function(e) {
        if(e)
            d.reject(new Error('Error retrieving user and product due to: ' + JSON.stringify(e)));
        else
            d.resolve(result);
    });

    return d.promise;
}


BulkLoader.prototype.bulkIndex = function(documents) {
    var d = deferred();

    var request = [];

    _.forEach(documents, function(doc) {
        request.push({ index: { _index: this.index, _type: this.type } });
        if(!doc.hasOwnProperty('id'))
            doc.id = this.nextId++;
        request.push(doc);
    }, this);

    var id =  documents[0].id 

    this.client.bulk({
        requestTimeout: '60000',
        timeout: '1m',
        body: request
    }).then(function(b) {
        d.resolve(true);
    }, function(e) {
        d.reject(new Error('At batch, starting doc id: ' + id + ' - Unable to bulk insert due to: ' + JSON.stringify(e)));
    });

    return d.promise;
}

BulkLoader.prototype.disableIndexRefresh = function () {
    var d = deferred();

    var params = {
        index: this.index,
        body: {
            index : {
                "refresh_interval" : -1
            }
        }
    };

    this.client.indices.putSettings(params).then(function (b) {
        d.resolve(true);
    }, function (e) {
        d.reject(new Error('Unable to disable index refresh due to: ' + JSON.stringify(e)));
    });

    return d.promise;
}

BulkLoader.prototype.enableIndexRefresh = function () {
    var d = deferred();

    var params = {
        index: this.index,
        body: {
            index : {
                "refresh_interval" : '1s'
            }
        }
    };

    this.client.indices.putSettings(params).then(function (b) {
        d.resolve(true);
    }, function (e) {
        d.reject(new Error('Unable to enable index refresh due to: ' + JSON.stringify(e)));
    });

    return d.promise;
}

BulkLoader.prototype.optimize = function () {
    var d = deferred();

    var params = {
        index: this.index,
        maxNumSegments: 1
    };

    this.client.indices.optimize(params).then(function (b) {
        d.resolve(true);
    }, function (e) {
        d.reject(new Error('Unable to optimize index due to: ' + JSON.stringify(e)));
    });

    return d.promise;
}

BulkLoader.prototype.getById = function (id, indexName, type) {
    var d = deferred();
    this.client.get({
        index: indexName,
        type: type,
        id: id
    }).then(function(body) {
        d.resolve(body);
    }, function(error) {
        console.log(error);
        d.reject(new Error('Unable to getById of id: ' + id +'. Error: ' + JSON.stringify(error)));
    }
    );

    return d.promise;
}

module.exports = BulkLoader;