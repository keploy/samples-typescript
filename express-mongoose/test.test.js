const {
    FetchTestSets,
    RunTestSet,
    FetchTestSetStatus,
    TestRunStatus,
    StopUserApplication,
    StartUserApplication,
} = require('@keploy/typescript-sdk/dist/keployV2/keployCli');
// require('./src/app')
const { expect } = require('@jest/globals');
describe('Keploy Server Tests', () => {
    test('TestKeploy', async () => {
        let testResult = true;
        const MAX_TIMEOUT = 10000;
        let startTime = Date.now();
        try {
            const testSets = await FetchTestSets();
            if (testSets === null) {
                throw new Error('Test sets are null');
            }
            console.log("TestSets: ", [...testSets]);
            console.log("starting user application");
            for (let testset of testSets) {
                let result = true;
                console.log(testset,"testsset")
                StartUserApplication("npm start")
                const testRunId = await RunTestSet(testset);
                let testRunStatus;
                while (true) {
                    await new Promise(res => setTimeout(res, 10000));
                    testRunStatus = await FetchTestSetStatus(testRunId);
                    if (testRunStatus === TestRunStatus.RUNNING) {
                        console.log("testRun still in progress");
                        if (Date.now() - startTime > MAX_TIMEOUT) {
                            console.log("Timeout reached, exiting loop");
                            break;
                        }
                        continue;
                    }
                    break;
                }

                if (testRunStatus === TestRunStatus.FAILED || testRunStatus === TestRunStatus.RUNNING) {
                    console.log("testrun failed");
                    result = false;
                } else if (testRunStatus === TestRunStatus.PASSED) {
                    console.log("testrun passed");
                    result = true;
                }
                console.log(`TestResult of [${testset}]: ${result}`);
                testResult = testResult && result;
                StopUserApplication()
            }
        } catch (error) {
            throw error;
        }
        expect(testResult).toBeTruthy();

    }, 300000);
}, 300000);