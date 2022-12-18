import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

export async function runTestFile(testFile) {
  const code = await fs.promises.readFile(testFile, 'utf8');

  try {
    eval(code);
  } catch (error) {
    console.error(error);
  }
}

// Read the data from parent
const { testFile } = workerData;
const result = await runTestFile(testFile);

parentPort.postMessage({ result });
