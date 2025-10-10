// Script para inicializar o Replica Set
rs.initiate({
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "mongodb:27017"
    }
  ]
});

// Aguardar a inicialização
sleep(5000);

// Verificar status
rs.status();
