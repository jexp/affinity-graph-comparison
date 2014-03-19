var byline = require('byline');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var NanoTimer = require('nanotimer');

var m, options;

var _progress = null;
var _users_by_id = {};
var _user_map = {};
var _products_by_id = {};
var _product_map = {};
var _affinities_all = [];

function pick_from( values, index ) {
    return values[ index % values.length ];
}

function loadUsers( callback ) {
    _progress("Loading users");
    byline(fs.createReadStream('data/'+options.data_set+'/users.json', { encoding: 'utf8' })).on('data', function(line) {
        var user = JSON.parse( line );
        _users_by_id[ user.id ] = user;
    }).on('finish',function() {
        var users =  _.values( _users_by_id );
        console.log(users.length);
        var groups=[];
        while (users.length) { groups.push(users.splice(0,10000)); }
        async.eachLimit( groups, 8, function( user, scb ) {
            m.addUser( user ).then( function( id ) {
//              _user_map[ user.id ] = id;
                scb( null, null );
            } );
        }, function() {
            callback(null,null);
        } );
    });
}

function loadProducts( callback ) {
    _progress("Loading products");
    byline(fs.createReadStream('data/'+options.data_set+'/products.json', { encoding: 'utf8' })).on('data', function(line) {
        var product = JSON.parse( line );
        _products_by_id[ product.id ] = product;
    }).on('finish',function() {
        var products =  _.values( _products_by_id );
        console.log(products.length);
        var groups=[];
        while (products.length) { groups.push(products.splice(0,10000)); }
        async.eachLimit( groups, 8, function( product, scb ) {
            m.addProduct( product ).then( function( id ) {
//              _product_map[ product.id ] = id;
                scb( null, null );
            } );
        }, function() {
            callback(null,null);
        } );
    });
}

function loadAffinities( callback ) {
    _progress("Loading affinities");
    byline(fs.createReadStream('data/'+options.data_set+'/affinities.json', { encoding: 'utf8' })).on('data', function(line) {
        _affinities_all.push( JSON.parse( line ) );
    }).on('finish',function() {
        console.log(_affinities_all.length);
        var loaded = 0;
        var affinities = [].concat(_affinities_all);
        var groups=[];
        while (affinities.length) { groups.push(affinities.splice(0,10000)); }
        async.eachLimit( groups, 8 ,function( group, scb ) {
            var mapped_affinities=group.map(function(affinity) { return { user_id: affinity.user_id , product_id: affinity.product_id , relation: affinity.relation}; } )
            m.addAffinities( mapped_affinities ).then( function() {
                loaded+=mapped_affinities.length;
                scb( null, null );
            } );
        }, function() {
            callback(null,null);
        } );
    });
}

function startTest( callback ) {
    _progress( 'starting test' );
    m.startTest().then( function() {
        callback(null,null);
    } );
}

function testDriver( _m, _options, progress, complete ) {
    _progress = progress;

    m = _m;
    options = _options;

    m.startLoading( options.noload ? false : true ).then( function() {
        var setupSteps = [];
        if ( options.noload == false ) {
            setupSteps = [
                loadUsers,
                loadProducts,
                loadAffinities,
                startTest
            ]
        }

        async.series( setupSteps ,function(){
            var results = [];
            var total_time = 0.0;
            async.eachSeries([1,2,3,4,5], function( index, callback ) {
                var timerObject = new NanoTimer();
                progress( 'running query' );
                timerObject.time( function( tcb ) {
                    m.query(
                        { hair:pick_from( ['red','black','blond','green' ], index ) },
                        {},
                        pick_from( [ 'follow','own' ], index )
                    ).then( function( result ) {
                        tcb();
                    } );
                }, '', 'u', function( time ) {
                    total_time += time;
                    results.push( time / 1000.0 );
                    callback( null, null );
                } );
            }, function() {
                progress( 'ending' );
                m.endTest();
                complete( { query: ( total_time / 1000.0 ) / 5.0, results: results } );
            } );
        });
    } );
}

module.exports = testDriver;
