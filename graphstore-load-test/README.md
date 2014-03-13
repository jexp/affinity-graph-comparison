graphstore-load-test
============

This code is used to run the benchmarking harness for the various datastores.

First install the node modules with

```
npm install
```

Then copy the five graphstore projects into *node_modules*.

Then you can create datasets by running

```
node data/create.js --count <NUM USERS> --name <NAME OF DATASET DIRECTORY>
```

where *count* is the number of users to create for the dataset and *name* is the name of the directory to store the dataset. The generated dataset will be created in the *data* directory.

To run the benchmark, your datastores must be running. You can test whether the code can connect to your datastore by running the tests in the individual graphstore projects.

You can then run the benchmarking harness with

```
node src/test.js --name <NAME OF DATASET DIRECTORY>
```

This will load the data into the individual datastores and time queries against it.

Additional options are:

* ```--only <NAME OF DATASTORE TO RUN>``` : This will run the benchmark only for the selected datastore. You can find the name of each datastore in its *src/index.js*  in the ```configurations``` method.
* ```--noload``` : This will skip the loading of data. This assumes that the data is already loaded into the datastore. This option is useful when you have already preloaded large datasets as loading large datasets with the test harness will be slow.
* ```--verbose``` : This will enable console statements that indicate progress.

The result of running this result in printing to the console, for each datastore, 

```
<NAME OF DATASTORE> <AVERAGE QUERY TIME> <QUERY TIME 1>, ... , <QUERY TIME 5>
```