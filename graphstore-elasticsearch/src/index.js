var deferred = require('deferred'),
    elasticsearch = require('elasticsearch'),
    async = require('async'),
    user = require('./user'),
    product = require('./product'),
    affinity = require('./affinity');

function ElasticSearchStore () {
    this.client = new elasticsearch.Client({
        hosts : 'localhost:9200',
        log: 'error'
    });
    this.user = new user(this.client);
    this.product = new product(this.client);
    this.affinity = new affinity(this.client, this.user, this.product);
}

ElasticSearchStore.prototype.configurations = function () {
    return [ [ 'ElasticSearch', new ElasticSearchStore() ] ];
}

ElasticSearchStore.prototype.addUser = function (user) {
    return this.user.create(user);
}

ElasticSearchStore.prototype.addProduct = function (product) {
    return this.product.create(product);
}

ElasticSearchStore.prototype.addAffinity = function (user_id, product_id, relation) {
    return this.affinity.create(user_id, product_id, relation);
}

ElasticSearchStore.prototype.startTest = function () {
    var d = deferred();

    var user = this.user,
        product = this.product,
        affinity = this.affinity;

    async.parallel([
        function (cb) {
            user.refresh().then(function(b) {
                cb(null, null);
            }, function (e) {
                cb('Unable to refresh users index due to: ' + e, null);
            });
        },
        function (cb) {
            product.refresh().then(function(b) {
                cb(null, null);
            }, function (e) {
                cb('Unable to refresh product index due to: ' + e, null);
            });
        },
        function (cb) {
            affinity.refresh().then(function(b) {
                cb(null, null);
            }, function (e) {
                cb('Unable to refresh affinity index due to: ' + e, null);
            });
        }
    ], function(error, result) {
        if(error != null)
            d.reject( new Error('Unable to refresh indices due to : ' + error) );
        else
            d.resolve(true);
    });

    return d.promise;
}

ElasticSearchStore.prototype.startLoading = function (clean) {
    var d = deferred();

    if(clean === undefined || clean === true) {

        var user = this.user,
            product = this.product,
            affinity = this.affinity;

        async.parallel([
            function(cb) { 
                user.resetIndex().then(function(result){
                    cb(null, null);
                }, function(error){
                    console.error('user');
                     console.error(error);
                    cb(error, null);
                });
            },
            function(cb) { 
                product.resetIndex().then(function(result){
                    cb(null, null);
                }, function(error){
                    console.error('product');
                    console.error(error);
                    cb(error, null);
                });
            },
            function(cb) { 
                affinity.resetIndex().then(function(result){
                    cb(null, null);
                }, function(error){
                    console.error('affinity');
                     console.error(error);
                    cb(error, null);
                });
            }
        ], function(error, result){
            if(error == null) {
                return d.resolve(true);
            } else {
                return d.reject(new Error("failed to start loading"));
            }
        });
    }
    else 
        process.nextTick(function() { d.resolve(true); });

    return d.promise;
}

ElasticSearchStore.prototype.query = function ( user_terms, product_terms, relation ) {
    var d = deferred();

    user_terms = this._changeKeys(user_terms, '_user.');
    product_terms = this._changeKeys(product_terms, '_product.');

    var query = this._convertQueryToBoolOfTermsFilter(this._mergeTerms(user_terms, product_terms, relation));

    if(Object.keys(query).length === 1 && query.relation == null)
        query = {};

    this.affinity.getByQuery(query).then(function(result) {
        d.resolve(result);
    }, function(error) {
        d.reject(error);
    });

    return d.promise;
}

ElasticSearchStore.prototype._mergeTerms = function(user_terms, product_terms, relation) {
    var result = {};

    result.relation = relation;

    for(var key in user_terms)
        result[key] = user_terms[key];

    for(var key in product_terms)
        result[key] = product_terms[key];

    return result;
}

ElasticSearchStore.prototype._changeKeys = function(obj, key_prefix) {
    var result = {};

    for(var key in obj) {
        result[key_prefix+key] = obj[key];
    }

    return result;
}

ElasticSearchStore.prototype._convertQueryToBoolOfTermsFilter = function (obj) {
    result = [];

    for(var key in obj) {
        var val = obj[key],
            filter = { terms : { } };

        if(Object.prototype.toString.call( val ) === '[object Array]') {
            filter.terms[key] =  val;
        } else {
            filter.terms[key] =  [val];
        }
        result.push(filter);
    }

    return result;
}

ElasticSearchStore.prototype.endTest = function ()
{
    this.client.close();
}

module.exports = ElasticSearchStore;