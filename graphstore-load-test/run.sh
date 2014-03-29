NEO=$HOME/Downloads/neo4j-enterprise-2.0.1
SIZE=${1-10000}
$NEO/bin/neo4j stop
rm -rf "$NEO/data/graph.db"
$NEO/bin/neo4j start
if [ ! -d "data/$SIZE" ]; then
   echo "Creating Data $SIZE"
   node data/create.js --count $SIZE --name $SIZE
fi
node src/test.js --name $SIZE --only neo4j --verbose
$NEO/bin/neo4j stop
zip -r graphdb_${SIZE}.zip $NEO/data/graph.db
$NEO/bin/neo4j start
echo "Running Tests for $SIZE...."
node src/test.js --name $SIZE --only neo4j --verbose --noload
echo "Running Tests for $SIZE...."
node src/test.js --name $SIZE --only neo4j --verbose --noload
echo "Test size $SIZE " >> test.log
node src/test.js --name $SIZE --only neo4j --verbose --noload >> test.log

