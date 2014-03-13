var reader = require('./FileReader');
var affinityReader = require('./AffinityFileReader');
var argv = require('optimist').demand(['path','num_users']).argv;

var path = argv.path
var numUsers = argv.num_users;
var numProducts = Math.floor( numUsers / 3 );
var numAffinities = numUsers * 2;

var fileReader = new reader('users', 'user', numUsers, path + 'users.json');

fileReader.load().then(function () {
    fileReader = new reader('products', 'product', numProducts, path + 'products.json');
    return fileReader.load();
}, function (e) {
    console.error(e);
}).then(function () {
    fileReader = new affinityReader('affinity', 'affinity', numAffinities, path + 'affinities.json');
    return fileReader.load();
}, function (e) {
    console.error(e);
}).done(function() {
    console.log('Done loading')
}, function (e) {
    console.error(e);
})
