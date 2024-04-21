### Postman test cases

```
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 100ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(100);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});


```

![images](https://raw.githubusercontent.com/priyankarpal/samples-typescript/ppal/express-mongo-priyank/images/postman.png)

## Jest

![images](https://raw.githubusercontent.com/priyankarpal/samples-typescript/ppal/express-mongo-priyank/images/jest.png)
![images](https://raw.githubusercontent.com/priyankarpal/samples-typescript/ppal/express-mongo-priyank/images/jestcoverage.png)
