graphstore-elasticsearch
============

This code was used with an installation of Elasticsearch 0.90.11.

Our tests were run with a modified configuration. In ```elasticsearch.yml```, we uncommented 

```
index.number_of_shards: 1
index.number_of_replicas: 0
```

To run the tests:

```
jasmine-node specs
```