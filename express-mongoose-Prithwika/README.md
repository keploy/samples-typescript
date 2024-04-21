```
pm.test("Response should have status 200", function () {
pm.response.to.have.status(200);
});

pm.test("Unknown user should get a response 500", function () {
pm.response.to.have.status(500);
});

pm.test("Wrong password should have status code 500", function () {
pm.response.to.have.status(500);
});
```
