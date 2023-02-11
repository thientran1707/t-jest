import { WorkerPool } from '../thread-pool/index.mjs';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import chalk from 'chalk';

const filename = fileURLToPath(import.meta.url);
const { dir: currentFilePath } = path.parse(filename);

const cpuCount = os.cpus().length;
const workerPool = new WorkerPool(
  cpuCount - 1,
  path.join(currentFilePath, 'worker.mjs')
);

export async function runTestFiles(testFiles, rootDir) {
  // Spawn the new worker for each testFile
  // Note that this is not very efficient, since creating worker is costly
  // It will be more efficient to use thread pool
  let hasFailedTestCase = false;

  await Promise.all(
    testFiles.map(async testFile => {
      return new Promise((resolve, reject) => {
        workerPool.runTask({ testFile }, (err, result) => {
          if (err) {
            console.log('Error when running test: ', err.message);
            reject();
          }

          const { success, errorMessage } = result;
          const status = success
            ? chalk.green.inverse.bold(' PASS ')
            : chalk.red.inverse.bold(' FAIL ');
          console.log(
            `${status} ${chalk.dim(path.relative(rootDir, testFile))}`
          );
          if (!success) {
            hasFailedTestCase = true;
            console.log(`${errorMessage}`);
          }

          resolve();
        });
      });
    })
  );

  // close workerPool
  workerPool.close();

  if (hasFailedTestCase) {
    console.log(
      chalk.red.bold('Test run failed, please fix the failing tests')
    );
    process.exitCode = 1;
  }
}
