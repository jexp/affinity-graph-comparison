elasticsearch-bulk-loader
============

This project loads the data created by the script in graphstore-load-test/data/create.js into elasticsearch as a bulk operation. This is more efficient than the loading done in graphstore-load-test itself and is useful at datasets with 50k or more users. 

Usage:

```
node src/index.js --path <PATH TO DATA DIRECTORY> --num_users <NUMBER OF USERS FOR DATASET>
```