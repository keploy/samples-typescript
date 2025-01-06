curl -X GET "http://localhost:8000/stu"

curl -X GET "http://localhost:8000/stu"

curl -X GET "http://localhost:8000/stu"

curl -X POST http://localhost:8000/students \
   -H "Content-Type: application/json" \
   -d '{"name": "John Doe", "email": "john@example.com", "phone": 123456789}'

curl --request POST \
      --url http://localhost:8000/students \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --header 'Host: localhost:8000' \
      --header 'User-Agent: curl/7.88.1' \
      --data '{"name":"Alice Green","email":"green@alice.com","phone":"3939201584"}'

curl --request POST \
      --url http://localhost:8000/students \
      --header 'Host: localhost:8000' \
      --header 'User-Agent: curl/7.88.1' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --data '{
        "name":"John Do",
        "email":"john@xyiz.com",
        "phone":"0123456799"
        }'

curl -X GET http://localhost:8000/students

curl --request GET http://localhost:8000/students