const {expect} = require("@jest/globals");
const keploy = require("@keploy/sdk"); //shortend this
const os = require('os');
const timeOut = 300000;

describe(
  "Keploy Server Tests",
  () => {
    test(
      "TestKeploy",
      (done) => {
    const username = os.userInfo().username;

       console.log("printing the env variable from the unit test file", username)
      //  console.log("printing the env variable", process.env.ABC)

        const cmd = "npm start";
        const options = {
          maxTimeout: 1000000
        };
        keploy.Test(cmd, {maxTimeout: 600000}, (err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res).toBeTruthy(); // Assert the test result
            done();
          }
        });
      },
      timeOut
    );
  },
  timeOut
);