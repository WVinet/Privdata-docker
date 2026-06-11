
# iniciar todas las bdd que se necesite

docker-compose up -d postgres-auth postgres-organization postgres-arco postgres-compliance

docker-compose stop postgres-auth postgres-organization postgres-arco postgres-compliance

