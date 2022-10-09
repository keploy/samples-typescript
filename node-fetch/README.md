# Example node-fetch app
A sample node-fetch app containing GET and POST request

## Installation
### Start keploy server
```shell
git clone https://github.com/keploy/keploy.git && cd keploy
docker-compose up
```

### Setup node-fetch app
```bash
git clone https://github.com/keploy/samples-typescript && cd node-fetch
npm i
npm i https://github.com/keploy/typescript-sdk
```

```bash
export KEPLOY_MODE="record"
export KEPLOY_APP_NAME="node-fetch-app"
export KEPLOY_APP_HOST="localhost"
export KEPLOY_APP_PORT=3000 # port on which server is running
export KEPLOY_APP_DELAY=5 # time delay before starting testruns(in seconds)
export KEPLOY_APP_TIMEOUT=100 # should be number 
# export KEPLOY_APP_FILTER={"urlRegex":"*"}  # should be json not to capture for certain url's

export KEPLOY_SERVER_URL="http://localhost:6789/api" # self hosted keploy running server
# export KEPLOY_SERVER_LICENSE="XXX-XXX-XXX" # hosted keploy server api key
```

### Run the application
```shell
node server.js

```

## Generate testcases

To genereate testcases we just need to make some API calls. You can use [Postman](https://www.postman.com/), [Hoppscotch](https://hoppscotch.io/), or simply `curl`

###1. Post the data

```bash
curl --request POST \
  --url http://localhost:3000/postData \
  --header 'content-type: application/json' \
  --data '{
    "name": "Joey",
    "job": "Actor"
}'
```
this will return :
```
{
  "id": "862",
  "createdAt": "2022-10-07T09:43:40.211Z"
}
```

###2. Get the data
```bash
curl --request GET \
  --url http://localhost:3000/getData
```

or by querying through the browser `http://localhost:3000/getData`


Now both these API calls were captured as a testcase and should be visible on the [Keploy console](http://localhost:6789/testlist).
If you're using Keploy cloud, open [this](https://app.keploy.io/testlist).

You should be seeing an app named `node-fetch-app` with the test cases we just captured.


Now, let's see the magic! 🪄💫


## Test mode

Now that we have our testcase captured, run the tests.
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
testing  1  of  4  { testcase id:  4ceeb33e-712c-44e9-b943-eedf4cb62206  }
GET request at /getData route
testing  2  of  4  { testcase id:  9263d903-acbb-456f-81c4-d4ff551ea302  }
GET request at /getData route
testing  3  of  4  { testcase id:  c3d9d430-3021-4e05-85ff-56acd5ab0d6b  }
GET request at /getData route
testing  4  of  4  { testcase id:  5ffefe33-8b4b-4519-88cc-29400e84302e  }
GET request at /getData route
result { testcase id:  4ceeb33e-712c-44e9-b943-eedf4cb62206  }, { passed:  true  }
result { testcase id:  9263d903-acbb-456f-81c4-d4ff551ea302  }, { passed:  true  }
result { testcase id:  c3d9d430-3021-4e05-85ff-56acd5ab0d6b  }, { passed:  true  }
result { testcase id:  5ffefe33-8b4b-4519-88cc-29400e84302e  }, { passed:  true  }
test run completed { run id:  bf98b0ed-5793-4280-af60-0b022d533611  }, passed overall:  true
```

So no need to setup dependencies like mongoDB, web-go locally or write mocks for your testing.

**The application thinks it's talking to the
server 😄**

Go to the Keploy Console/testruns to get deeper insights on what testcases ran, what failed.