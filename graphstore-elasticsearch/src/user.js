var deferred = require('deferred');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function User(client) {
    this.client = client;
    this.create = __bind(this.create, this);
    this.getById = __bind(this.getById, this);
    this.getByQuery = __bind(this.getByQuery, this);
    this.createIndex = __bind(this.createIndex, this);
    this.deleteIndex = __bind(this.deleteIndex, this);
    this.doesIndexExist = __bind(this.doesIndexExist, this);
    this.resetIndex = __bind(this.resetIndex, this);
    this.nextId = 1;
}

User.prototype.create = function (user) {
    var d = deferred();
    if(!user.hasOwnProperty('id'))
        user.id = this.nextId++;
    this.client.create({
        index: 'users',
        type: 'user',
        body: user
    }).done(function(body) {
        d.resolve(body['_id']);
    }, function(error) {
        d.reject(new Error('Unable to create user: ' + JSON.stringify(user) + ". Error: " + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.getById = function (id) {
    var d = deferred();

    this.client.get({
        index: 'users',
        type: 'user',
        id: id
    }).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to getById of id: ' + id +'. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.getByQuery = function (query) {
    var d = deferred();

    var result = [],
        client = this.client;

    function handleResponse (response) {
        var hits = response.hits.hits;

        hits.forEach(function(h) { result.push(h); } );
        if(response.hits.total === result.length) {
            d.resolve(result);
        } else {
            client.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }).then(function(response) {
                handleResponse(response);
            }, function(error) {
                d.reject(new Error('Unable to getByQuery of id: ' + query +'. Error: ' + JSON.stringify(error)));
            });
        }
    }

    client.search({
        index: 'users',
        scroll: '30s',
        body: {
            filter: {
                bool : {
                    must: query
                }
            }
        }
    }).then(function(body) {
        handleResponse(body);
    }, function(error) {
        d.reject(new Error('Unable to getByQuery of id: ' + query +'. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.createIndex = function () {
    var d = deferred();

    this.client.indices.create({
        index: 'users',
        body: {
            "mappings" : {
                "user" : {
                    "_id" : {
                        "path" : "id"
                    }
                }
            }
        }
    }).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to create user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.deleteIndex = function () {
    var d = deferred();

    this.client.indices.delete({index:'users'}).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to delete user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.doesIndexExist = function () {
    var d = deferred();

    this.client.indices.exists({index:'users'}).done(function(body) {
        d.resolve(body);
    }, function(error) {
        d.reject(new Error('Unable to check existence of user index. Error: ' + JSON.stringify(error)));
    });

    return d.promise;
}

User.prototype.resetIndex = function () {
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

User.prototype.refresh = function () {
    var d = deferred();

    this.client.indices.refresh({
        index: "users"
    }, function (err, body) {
        if(err != null)
            d.reject( new Error("Unable to refresh users index due to: " + err) );
        else
            d.resolve(true);
    });

    return d.promise;
}

module.exports = User;
