// Built-in node_modules
import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

export async function runTestFile(testFile) {
  const code = await fs.promises.readFile(testFile, 'utf-8');

  console.log('code = ', code);
  return code;
}

// Read the data from parent
const { testFile } = workerData;
const result = await runTestFile(testFile);

parentPort.postMessage({ result });
