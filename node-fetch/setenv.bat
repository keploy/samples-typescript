setx KEPLOY_APP_NAME "sample-node-fetch" @REM App_Id for keploy
setx KEPLOY_APP_HOST "localhost" @REM sample API server host
setx KEPLOY_APP_PORT 8080 @REM Port on which the sample app is running
setx KEPLOY_APP_DELAY 5 @REM Delay before running testcases in test mode. It should be number
setx KEPLOY_APP_TIMEOUT 100 @REM request timeout for simulation of actual call in test mode. It should be number
setx KEPLOY_SERVER_URL "localhost:6789" @REM URL on which keploy grpc server binary is running. Default: "localhost:6789"
setx KEPLOY_MODE "record" @REM Mode on which sample API server starts running. Default: "off". Possible valid other values: "record" or "test" 
