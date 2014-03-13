var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var loader = require('./BulkLoader');
var creator = require('./IndexCreator');
var elasticsearch = require('elasticsearch');
var async = require('async');
var deferred = require('deferred');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function FileReader(indexName, type, numExpected, path) {
    this.indexName = indexName;
    this.type = type;
    this.numExpected = numExpected;
    this.path = path;
    this.batchSize = 10000;

    this.numIndexed = 0;
    this.documents = [];
    this.client = new elasticsearch.Client({
        hosts : 'localhost:9200',
        log: 'error'
    });
    this.loader = new loader(this.client, this.indexName, this.type);
    this.indexCreator = new creator(this.client);
    var worker = function(a, cb) {
        this.documents.push(a);
        if(this.documents.length >= this.batchSize) {
            this.rl.pause();
            var batch = this.documents;
            this.documents = [];
            this.bulkLoad(batch, cb);
        } else
            cb();
    };
    worker = __bind(worker, this);
    this.queue = async.queue(worker, 1);
    this.rl = null;

    this.load = __bind(this.load, this);
    this.bulkLoad = __bind(this.bulkLoad, this);
    this.readFile = __bind(this.readFile, this);

}

FileReader.prototype.load = function () {
    var d = deferred();
    var _this = this;

    this.indexCreator.resetIndex(this.indexName, this.type).then(function(b) {
        console.log('index reset');
        _this.loader.disableIndexRefresh().then(function(b1) {
            console.log('index refresh disabled');
            _this.readFile(d);
        }, function (e) {
            d.reject(e);
        });
    }, function (e) {
        d.reject(e);
    });

    return d.promise;
}

FileReader.prototype.bulkLoad = function (batch, cb) {
    var _this = this;

    this.loader.bulkIndex(batch).then(function(b) {
        _this.numIndexed += batch.length;
        if(_this.numIndexed === _this.numExpected) {
            _this.loader.enableIndexRefresh().then(function(b) {
                console.log('index reenabled');
                _this.client.close();
                _this.client = null;
                console.log('closing');
            }, function(e) {
                console.error(e);
            });
        }
        console.log('indexed documents. numIndexed: ' + _this.numIndexed);
        _this.rl.resume();
        cb();
    }, function(e) {
        console.error(e);
        cb(e);
    });
}

FileReader.prototype.readFile = function (promise) {
    var instream = fs.createReadStream(this.path, { encoding: 'utf8' });
    var outstream = new stream;
    this.rl = readline.createInterface(instream, outstream);

    var _this = this;

    this.rl.on('line', function(line) {
        _this.queue.push(JSON.parse(line));
    });

    this.rl.on('close', function() {
        if(_this.documents.length > 0)
            _this.bulkLoad(_this.documents, function (e) { 
                if(e)
                    promise.reject(e);
                else
                    promise.resolve(true) 
            });
        else
            promise.resolve(true);
    });
}

module.exports = FileReader;
