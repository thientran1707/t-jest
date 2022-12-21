import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';
import vm from 'vm';
import { TestEnvironment } from 'jest-environment-node';

// Assertions
import { expect } from '../assertion/index.mjs';

// https://github.com/facebook/jest/issues/10039
// Since we are using eval, each test case is not isolated
export async function runTestFile(testFile) {
  const code = await fs.promises.readFile(testFile, 'utf8');

  const testResult = {
    success: false,
    errorMessage: null,
  };

  let testName;
  try {
    const describeFns = [];
    let currentDescribeFn;

    const describe = (name, fn) => describeFns.push([name, fn]);
    const it = (name, fn) => currentDescribeFn.push([name, fn]);

    // create NodeEnvironment and run it with VMContext to isolate the running of each test case
    const environment = new TestEnvironment({
      projectConfig: {
        testEnvironmentOptions: { describe, it, expect }
      },
    });
    vm.runInContext(code, environment.getVmContext());

    for (const [name, fn] of describeFns) {
      currentDescribeFn = [];
      testName = name;
      await fn();

      for (const [itName, itFn] of currentDescribeFn) {
        testName += ` ${itName}`;
        await itFn();
      }
    }

    // Update success to be true after all are executed
    testResult.success = true;
  } catch (error) {
    testResult.errorMessage = `${testName}: ${error.message}`;
  }

  return testResult;
}

// Read the data from parent
const { testFile } = workerData;
const result = await runTestFile(testFile);
parentPort.postMessage({ result });
