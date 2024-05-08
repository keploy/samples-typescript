curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user1",
    "email":"user1@keploy.io",
    "password":"12345",
    "roles": ["admin"]
}'

curl --location 'http://localhost:8080/api/auth/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user1",
    "email":"user1@keploy.io",
    "password":"12345"
}'

curl --location 'http://localhost:8080/api/users'