// Built-in node_modules
import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';
import vm from 'vm';

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

    const context = { describe, it, expect };
    vm.createContext(context);
    vm.runInContext(code, context);

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
