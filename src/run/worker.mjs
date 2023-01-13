// Built-in node_modules
import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

// JS Environment
import { TestEnvironment } from 'jest-environment-node';

// Code transformation
import { transformSync } from '@babel/core';

// Assertions
import { expect } from '../assertion/index.mjs';

export async function runTestFile(testFile) {
  const testResult = {
    success: false,
    errorMessage:null,
  };

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
    const stack = [];

    const customRequire = fileName => {
      const currentDir = stack[stack.length - 1]; // stack.peek()
      const filePath = path.join(currentDir, fileName);

      const rawCode = fs.readFileSync(filePath, 'utf-8');
      // Transform code to CommonJS with Babel
      const { code } = transformSync(rawCode, {
        plugins: ['@babel/plugin-transform-modules-commonjs']
      });

      stack.push(path.dirname(filePath));

      // Create module factory
      const moduleFactory = vm.runInContext(`(function(module, exports, require) {${code}})`, environment.getVmContext());

      const module = { exports: {} };

      // Run the code
      moduleFactory(module, module.exports, customRequire);

      stack.pop();
      return module.exports;
    };

    // customRequire will run the code
    stack.push(path.dirname(testFile));
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
