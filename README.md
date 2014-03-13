Affinity Graph Comparison Code
==============================

This project contains the code we used to benchmark the various datastores we were considering for an affinity graph system. The actual benchmarking project is [graphstore-load-test](graphstore-load-test). The other five graphstore projects are the drivers used to interface with the datastores. The [last project](elasticsearch-bulk-loader) is a bulk loader for Elasticsearch, which we used to more efficiently load large datasets. 

In our affinity graph system you have three entities; products, users and affinities, where affinities relate a user to a product. For example; user A likes product B. User A and Product B are the entities, and 'like' is the affinity.

While this sounds like an easy relational problem, the twist is that we want to support arbitrary key/value pairs associated with both products and users, and query on those key/value pairs. For example the system should be able to satisfy a query looking for any red haired users that like blu-ray products. Where red hair is an attribute of user, and blu-ray is an attribute on product.

Each sub-project in this folder contains a different 'driver' for each particular storage technology. In addition there is the graphstore-load-test directory which contains our testing system that we used to run queries against each driver to gauge their efficiency.
