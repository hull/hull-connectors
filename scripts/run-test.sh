for file in "$@"
do
  NODE_ENV=test mocha --require ./root-babel-register --exit -R spec $file
done
