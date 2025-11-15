#!/usr/bin/env bash
set -e

CONTAINER_NAME="mongo-rs"
MONGO_IMAGE="mongo:8.0"
REPLSET_NAME="rs0"
PORT="27017"
VOLUME_NAME="mongo_data"

echo "🧹 Removendo container antigo (se existir)..."
docker rm -f $CONTAINER_NAME >/dev/null 2>&1 || true

echo "🚀 Subindo novo container MongoDB com replica set..."
docker run -d \
  --name $CONTAINER_NAME \
  -v $VOLUME_NAME:/data/db \
  -p $PORT:27017 \
  $MONGO_IMAGE \
  --replSet $REPLSET_NAME --bind_ip_all

echo "⏳ Aguardando Mongo iniciar..."
sleep 5

echo "⚙️ Inicializando replica set..."
docker exec -it $CONTAINER_NAME mongosh --eval "rs.initiate({
  _id: '$REPLSET_NAME',
  members: [{ _id: 0, host: 'localhost:$PORT' }]
})" || true

echo "✅ Verificando status do replica set..."
docker exec -it $CONTAINER_NAME mongosh --eval "rs.status()"

echo ""
echo "🎉 MongoDB com replica set '$REPLSET_NAME' iniciado!"
echo "URI para Compass:"
echo "👉 mongodb://localhost:$PORT/?replicaSet=$REPLSET_NAME"
