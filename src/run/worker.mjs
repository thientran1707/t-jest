import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

export async function runTestFile(testFile) {
  const code = await fs.promises.readFile(testFile, 'utf8');

  const testResult = {
    success: false,
    errorMessage: null,
  };

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

console.log('worker thread, running testFile: ', testFile);
const result = await runTestFile(testFile);
console.log('worker thread, test result = ', result);
parentPort.postMessage({ result });
