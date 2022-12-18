import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

export async function runTestFile(testFile) {
  const code = await fs.promises.readFile(testFile, 'utf8');

  const testResult = {
    success: false,
    errorMessage: null,
  };

  try {
    // Expose to eval and our running test cases will access `expect` function
    const expect = (received) => {
      return {
        toBe: (expected) => {
          if (received !== expected) {
            throw new Error(`Expected ${expected} but received ${received}`);
          }

          return true;
        }
      }
    }

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
