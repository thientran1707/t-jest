// Built-in node_modules
import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

// JS Environment
import { TestEnvironment } from 'jest-environment-node';

// Assertions
import { expect } from '../assertion/index.mjs';

export async function runTestFile(testFile) {
  const testResult = {
    success: false,
    errorMessage:null,
  };

  const code = await fs.promises.readFile(testFile, 'utf-8');

  let testName;
  try {
    const describeFns = [];
    let currentDescribeFn;

    const describe = (name, fn) => describeFns.push([name, fn]);
    const it = (name, fn) => currentDescribeFn.push([name, fn]);

    // With this
    const environment = new TestEnvironment({
      projectConfig: {
        testEnvironmentOptions: { describe, it, expect },
      },
    });

    /**
     *
     Statement: const test = require('./file.js');
     Will be equivalent to
     const test = () => {
       const module = { exports: {} };

       (function(module, exports, require) {
         // file.js code content
       })(module, module.exports, customRequire);

       return module.exports;
     })
     */
    const customRequire = fileName => {
      const code = fs.readFileSync(path.join(path.dirname(testFile), fileName), 'utf-8');
      // Create module factory
      const moduleFactory = vm.runInContext(`(function(module, exports, require) {${code}})`, environment.getVmContext());

      const module = { exports: {} };

      // Run the code
      moduleFactory(module, module.exports, customRequire);

      return module.exports;
    };

    customRequire(path.basename(testFile));

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
