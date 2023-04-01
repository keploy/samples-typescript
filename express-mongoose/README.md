# Example express-mongoose app
A sample mongoose app with express router containing GET, POST, PATCH and DELETE request integrated with keploy's [typescript-sdk](https://github.com/keploy/typescript-sdk) implementing the find(), updateOne(), deleteOne() and .save() methods of mongoose.

## Installation
### Setup express-mongoose app
```bash
git clone https://github.com/keploy/samples-typescript && cd expre
yarn
```
### Start keploy server
Run this commands for running kepoy server binary in MacOS.
```shell 
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_darwin_all.tar.gz" | tar xz -C /tmp

sudo mv /tmp/keploy /usr/local/bin && keploy
``` 
For other operating system, follow [this guide](https://github.com/keploy/keploy#quick-installation)



### Run the application
```shell
source .env && node server.js

```

## Generate testcases

To genereate testcases we just need to make some API calls. You can use [Postman](https://www.postman.com/), [Hoppscotch](https://hoppscotch.io/), or simply `curl`

###1. Post the data

```bash
curl --request POST \
  --url http://localhost:8080/postData \
  --header 'content-type: application/json' \
  --data '{
    "name": "Joey",
    "job": "Actor"
}'
```
this will return :
```
{
  "name":"Joey",
  "job":"Actor",
  "_id":"64287106d0c29b1da5f50790",
  "__v":0
}
```
```bash 
curl --request POST \ 
  --url http://localhost:8080/postData \  
  --header 'content-type: application/json' \
  --data '{
    "name": "Mitchell",               
    "job": "Painter"
}'
```
this will return:
```
{
  "name":"Mitchell",
  "job":"Painter",
  "_id":"64287106d0c29b1da5f50791",
  "__v":0
}
```

###2. Get the data
```bash
curl --request GET \
  --url http://localhost:8080/getData \  
  --header 'content-type: application/json' \
  --data '{
    "name": "Mitchell",                
    }'            
```
this will return:
```
{
  "name":"Mitchell",
  "job":"Painter",
  "_id":"64287106d0c29b1da5f50791",
  "__v":0
}
```

###3. Update the data
```bash
curl --request PATCH \
  --url http://localhost:8080/updateData \
  --header 'content-type: application/json' \
  --data '{
    "name": "Joey","job": "Accountant"
    }'
```
this will return: 
```
{
  "acknowledged":true,
  "modifiedCount":1,
  "upsertedId":null,
  "upsertedCount":0,
  "matchedCount":1
}
```

###4. Delete the data
```bash
curl --request DELETE \
  --url http://localhost:8080/deleteData \
  --header 'content-type: application/json' \
  --data '{
    "name": "Mitchell"
    }'
```
this will return:
```
{
  "acknowledged":true,
  "deletedCount":1
}
```


Now both these API calls were captured as a testcase and should be visible in "keploy/tests" folder in project directory.
If you're using Keploy cloud, open [this](https://app.keploy.io/testlist).

You should be seeing ` readable/editable yaml files` with their mocks in seperate yamls in "/mock" folder.


Now, let's see the magic! 🪄💫


## Test mode

Now that we have our testcase captured, change the KEPLOY_MODE in .env to "test". 
```shell
 export KEPLOY_MODE="test"
```

```shell
source .env && node server.js
```
output should look like
```shell
test starting in 5s
Example app listening on port 3000!
starting test execution. { id:  bf98b0ed-5793-4280-af60-0b022d533611  }, { total tests:  4  }
testing  1  of  4  { testcase id:  test-1  }
GET request at /getData route
testing  2  of  4  { testcase id:  test-2  }
GET request at /getData route
testing  3  of  4  { testcase id:  test-3  }
GET request at /getData route
testing  4  of  4  { testcase id:  test-4  }
GET request at /getData route
result { testcase id:  test-1  }, { passed:  true  }
result { testcase id:  test-2  }, { passed:  true  }
result { testcase id:  test-3  }, { passed:  true  }
result { testcase id:  test-4  }, { passed:  true  }
test run completed { run id:  bf98b0ed-5793-4280-af60-0b022d533611  }, passed overall:  true
```

So no need to setup dependencies like mongoDB, web-go locally or write mocks for your testing.

**The application thinks it's talking to the
server 😄**

Go to the Keploy server logs to get deeper insights on what testcases ran, what failed.