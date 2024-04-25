# NestJs + Drizzle  +Supabase

Tech STack - 
1. NestJs
2. Postgres
3. Supabase
4. Drizzle

### To install the deoendencies
```
npm install
```

Create a .env
.env requires `DATABASE_URL` for the db ( we have used Postgres)

### Setup Drizzle MIgration
``` 
npm run generate
```

### Start the app
```
npm run start
```

### To run tests(about 80% of test coverage until now)
```
npm run test:cov
```

### Postman Collection of routes
https://dark-sunset-197753.postman.co/workspace/My-Workspace~8503974e-6cc0-4f18-8a0e-1599701fd834/collection/33233997-092cc06c-24ae-40bd-8252-70f74c57abe8?action=share&creator=33233997

### Keploy 
Keploy helped generate test cases on various yaml files

```
keploy record -c "npm run start"
```

#### create test cases using - 
```
keploy test -c "npm run start" --delay 10
```
