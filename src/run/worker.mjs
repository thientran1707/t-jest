import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
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
  let environment;
  try {
    const describeFns = [];
    let currentDescribeFn;

    const describe = (name, fn) => describeFns.push([name, fn]);
    const it = (name, fn) => currentDescribeFn.push([name, fn]);

    const customRequire = fileName => {
      const dirname = path.dirname(testFile);
      const filePath = path.join(dirname, fileName);
      const code = fs.readFileSync(filePath, 'utf8');

      // Output
      /**
       *
       Statement: const test = require('./file.js');

       Will be equivalent to
       const test = () => {
         const module = { exports: {} };
         (function(module) {
           // file.js code
         })(module)

         return module.exports
       })
       */

      // Create module factory
      const moduleFactory = vm.runInContext(`(function(module) {${code}})`, environment.getVmContext());

      const module = { exports: {} };

      // Run the code
      moduleFactory(module);
      return module.exports;
    };

    // create NodeEnvironment and run it with VMContext to isolate the running of each test case
    environment = new TestEnvironment({
      projectConfig: {
        testEnvironmentOptions: { describe, it, expect, require: customRequire }
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
