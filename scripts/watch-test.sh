for file in "$@"
do
  NODE_ENV=test mocha --watch --require ./root-babel-register --exit -R spec $file
done
