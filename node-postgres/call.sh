curl -X POST -H "Content-Type: application/json" -d '{"name":"John","email":"doe@example.com"}' http://localhost:3000/api/users

curl -X POST -H "Content-Type: application/json" -d '{"name":"John Doe","email":"johndoe@example.com"}' http://localhost:3000/api/users

curl -X GET http://localhost:3000/api/users

curl -X PUT -H "Content-Type: application/json" -d '{"id":1,"name":"John Deo","email":"updated@example.com"}' http://localhost:3000/api/users

curl -X GET http://localhost:3000/api/users

curl -X DELETE -H "Content-Type: application/json" -d '{"id":1}' http://localhost:3000/api/users
