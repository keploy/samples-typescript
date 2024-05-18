This is a simple expressjs & mongodb sample app. simple rest api.

## Tech Stack

- Express.js
- MongoDB

## Getting Started

## Installation

1. Fork & Clone the repository <br>

```bash
git clone https://github.com/<your-github-username>/express-mongo-priyank
```

2. Install dependencies <br>

```bash
cd express-mongo-priyank
npm i
```

3. Start the server <br>

```bash
npm start
```

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
