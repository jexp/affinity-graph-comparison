for i in 1000 2500 5000 7500 10000 25000 50000 100000 175000 250000 500000 750000 1000000
do
	echo $i

	# Create the data
	rm -fr data/$i
	./data/create.js --name $i --count $i

	# MySQL Specific load-up
	node src/sql_convert.js --name $i
	mysql -uroot affinity < data/$i/complete.sql

	# Run the tests
	node src/test.js --name $i --only "MySQL - ETL" --noload
done
