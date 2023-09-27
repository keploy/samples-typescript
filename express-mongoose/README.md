# Node-Mongo-API

Small project using Node.js for understanding the working of MongoDB through the mongoose library.
Some validations have been added to the schema using the validator library.

Different API's have been added to perform CRUD operations on a database containing Students records.

// curl request post to http://localhost:8000/students
```json 
{
    "name":"Animesh",
    "email":"abc@xyz.com",
    "phone":"0123456798"
}
```