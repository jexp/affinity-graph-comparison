// Includes
var FileReader = require('./FileReader');

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function AffinityFileReader (indexName, type, numExpected, path) {
    FileReader.call(this, indexName, type, numExpected, path);
}

AffinityFileReader.prototype = Object.create(FileReader.prototype);

AffinityFileReader.prototype.bulkLoad = function (batch, cb) {
    var _this = this;

    this.loader.getUserAndProduct(batch).then(function(affinities) {
        _this.loader.bulkIndex(affinities).then(function(b) {
            _this.numIndexed += affinities.length;
            if(_this.numIndexed === _this.numExpected) {
                _this.loader.enableIndexRefresh().then(function(b) {
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
    }, function (e) {
        cb(e);
    });
}


module.exports = AffinityFileReader;
