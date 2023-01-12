// Built-in node_modules
import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

// Assertions
import { expect } from '../assertion/index.mjs';

export async function runTestFile(testFile) {
  const testResult = {
    success: false,
    errorMessage:null,
  };

  const code = await fs.promises.readFile(testFile, 'utf-8');

  try {
    eval(code);
    testResult.success = true;
  } catch (error) {
    testResult.errorMessage = error.message;
  }

  return testResult;
}

// Read the data from parent
const { testFile } = workerData;
const result = await runTestFile(testFile);

parentPort.postMessage({ result });
